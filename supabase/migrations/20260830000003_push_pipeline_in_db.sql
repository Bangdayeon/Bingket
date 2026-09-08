-- ============================================================
-- 푸시 파이프라인을 레포로 가져온다 (Database Webhook 3개 + Cron → pg_net / pg_cron)
--
-- 지금까지 웹훅 3개와 Cron 은 Supabase 대시보드에만 있었다. 레포에서는
-- "그런 게 어딘가 등록돼 있다" 는 README 문장 말고는 확인할 방법이 없었고,
-- 실제로 2026-08 에 Authorization 헤더가 빠져 알림이 통째로 사라진 적이 있는데
-- 그걸 코드로는 잡아낼 도리가 없었다. 여기로 옮기면 마이그레이션이 곧 명세가 된다.
--
-- 기존 대시보드 웹훅·Cron 제거도 **이 마이그레이션 안에서** 한다. 사람이 대시보드에서
-- 먼저 지우게 하면 순서가 틀렸을 때 알림이 두 번 간다. 같은 트랜잭션에서 지우고 만들면
-- 이중 발송 구간 자체가 존재하지 않는다.
-- ============================================================

create extension if not exists pg_net;
create extension if not exists pg_cron;
create extension if not exists supabase_vault with schema vault;

-- ============================================================
-- 1. 기존 대시보드 웹훅 제거
--
-- Supabase Database Webhook 은 대상 테이블에 붙은 평범한 트리거이고, 함수는
-- supabase_functions.http_request 다. 이름은 대시보드에서 지은 것이라 신뢰할 수 없으므로
-- "이 세 테이블에서 http_request 를 부르는 트리거" 를 기준으로 찾아 지운다.
-- ============================================================
do $webhook_cleanup$
declare
  r record;
begin
  if to_regprocedure('supabase_functions.http_request()') is null
     and to_regnamespace('supabase_functions') is null then
    return;
  end if;

  for r in
    select t.tgname, c.relname
    from pg_catalog.pg_trigger t
    join pg_catalog.pg_class c on c.oid = t.tgrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    join pg_catalog.pg_proc p on p.oid = t.tgfoid
    join pg_catalog.pg_namespace pn on pn.oid = p.pronamespace
    where n.nspname = 'public'
      and c.relname in ('comments', 'likes', 'notifications')
      and pn.nspname = 'supabase_functions'
      and p.proname = 'http_request'
      and not t.tgisinternal
  loop
    execute format('drop trigger if exists %I on public.%I', r.tgname, r.relname);
    raise notice '[push] 대시보드 웹훅 트리거 제거: public.%.%', r.relname, r.tgname;
  end loop;
end
$webhook_cleanup$;

-- 기존 Cron 잡도 정리한다. 대시보드에서 만든 잡의 이름을 알 수 없으므로
-- 우리 엣지 함수를 부르는 잡을 전부 찾아 지운다. 아래에서 다시 만든다.
do $cron_cleanup$
declare
  r record;
begin
  if to_regclass('cron.job') is null then
    return;
  end if;

  for r in
    select jobid, jobname from cron.job
    where command like '%notify-bingo-deadline%'
       or command like '%check-push-receipts%'
  loop
    perform cron.unschedule(r.jobid);
    raise notice '[push] 기존 cron 잡 제거: % (jobid %)', r.jobname, r.jobid;
  end loop;
end
$cron_cleanup$;

-- ============================================================
-- 2. 엣지 함수 호출 헬퍼
--
-- service_role 키를 마이그레이션에 적을 수 없으므로 Vault 에서 읽는다.
-- 값은 아래 public.set_push_config 로 넣는다 (마이그레이션 직후 1회).
--
-- private 스키마에 두고 실행 권한을 회수한다. 이 함수는 서버 키로 임의 주소에
-- 요청을 보낼 수 있으므로 클라이언트 롤이 부를 수 있으면 안 된다.
-- ============================================================
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.call_edge_function(p_function text, p_body jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_url    text;
  v_key    text;
  v_schema text;
begin
  -- 함수 전체를 예외 가드로 감싼다. 이 함수는 댓글 작성 같은 사용자 트랜잭션 안에서
  -- 트리거로 불린다. Vault 조회든 pg_net 호출이든 여기서 예외가 새어 나가면
  -- 댓글 자체가 롤백된다. 푸시가 안 가는 것보다 글이 안 써지는 게 훨씬 나쁘다.
  begin
    -- 한 사건이 알림 여러 건을 만들 수 있다 (팀 종료 → 멤버 수만큼). Vault 복호화와
    -- 카탈로그 조회를 행마다 반복하지 않도록 트랜잭션 안에서만 캐시한다.
    -- 트랜잭션 단위라 키를 교체하면 다음 트랜잭션부터 바로 반영된다.
    v_url    := nullif(current_setting('bingket.push_url', true), '');
    v_key    := nullif(current_setting('bingket.push_key', true), '');
    v_schema := nullif(current_setting('bingket.push_net_schema', true), '');

    if v_url is null or v_key is null then
      select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
      select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';

      if v_url is null or v_key is null then
        raise warning '[push] vault 에 project_url / service_role_key 가 없어 % 호출을 건너뜁니다', p_function;
        return;
      end if;

      perform set_config('bingket.push_url', v_url, true);
      perform set_config('bingket.push_key', v_key, true);
    end if;

    if v_schema is null then
      -- pg_net 이 어느 스키마에 깔려 있는지는 프로젝트마다 다르다 (net / extensions).
      -- search_path 를 비워 뒀으므로 pg_net 확장에 속한 http_post 를 직접 찾는다.
      select n.nspname into v_schema
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
      join pg_catalog.pg_depend d on d.objid = p.oid and d.deptype = 'e'
      join pg_catalog.pg_extension e on e.oid = d.refobjid and e.extname = 'pg_net'
      where p.proname = 'http_post'
      limit 1;

      if v_schema is null then
        raise warning '[push] pg_net 의 http_post 를 찾을 수 없어 % 호출을 건너뜁니다', p_function;
        return;
      end if;

      perform set_config('bingket.push_net_schema', v_schema, true);
    end if;

    -- pg_net 은 비동기다. 요청을 큐에 넣고 즉시 반환하므로 트랜잭션을 붙잡지 않는다.
    execute format('select %I.http_post(url := $1, headers := $2, body := $3)', v_schema)
    using
      v_url || '/functions/v1/' || p_function,
      jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || v_key
      ),
      p_body;
  exception when others then
    raise warning '[push] % 호출 실패: %', p_function, sqlerrm;
  end;
end;
$$;

revoke all on function private.call_edge_function(text, jsonb) from public, anon, authenticated;

-- 대시보드 웹훅이 보내던 것과 같은 모양의 페이로드를 만든다.
-- 엣지 함수들이 { type, table, record } 를 기대하므로 형태가 달라지면 안 된다.
create or replace function private.webhook_payload(p_table text, p_record jsonb)
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'type',   'INSERT',
    'table',  p_table,
    'schema', 'public',
    'record', p_record
  );
$$;

revoke all on function private.webhook_payload(text, jsonb) from public, anon, authenticated;

-- ============================================================
-- 3. Vault 값 주입용 RPC
--
-- 대시보드 Vault 화면에서 손으로 넣어도 되지만, 그러면 배포 절차에 사람 손이 하나 더
-- 필요하다. service_role 키로 한 번 호출하면 끝나도록 RPC 를 둔다.
-- 나중에 키를 교체할 때도 이걸 다시 부르면 된다.
--
-- service_role 은 원래부터 DB 전권을 가진 롤이라 이 함수로 새로 열리는 권한은 없다.
-- anon / authenticated 는 명시적으로 막는다.
-- ============================================================
create or replace function public.set_push_config(p_url text, p_key text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  select id into v_id from vault.secrets where name = 'project_url';
  if v_id is null then
    perform vault.create_secret(p_url, 'project_url', '푸시 파이프라인이 호출할 프로젝트 베이스 URL');
  else
    perform vault.update_secret(v_id, p_url);
  end if;

  select id into v_id from vault.secrets where name = 'service_role_key';
  if v_id is null then
    perform vault.create_secret(p_key, 'service_role_key', '엣지 함수 호출용 service_role 키');
  else
    perform vault.update_secret(v_id, p_key);
  end if;
end;
$$;

revoke all on function public.set_push_config(text, text) from public, anon, authenticated;
grant execute on function public.set_push_config(text, text) to service_role;

-- ============================================================
-- 4. 웹훅 3개를 트리거로
--
-- 트리거 이름을 zz_ 로 시작시켜 알림 행을 만드는 트리거보다 늦게 돌게 한다
-- (Postgres 는 같은 이벤트의 트리거를 이름 순서로 실행한다).
-- notifications 웹훅은 원래 순서 문제가 없지만 규칙을 통일해 둔다.
-- ============================================================
create or replace function private.dispatch_comment_push()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.call_edge_function(
    'notify-comment', private.webhook_payload('comments', to_jsonb(new))
  );
  return null;
end;
$$;

drop trigger if exists zz_dispatch_comment_push on public.comments;
create trigger zz_dispatch_comment_push
  after insert on public.comments
  for each row execute function private.dispatch_comment_push();

create or replace function private.dispatch_like_push()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.call_edge_function(
    'notify-like', private.webhook_payload('likes', to_jsonb(new))
  );
  return null;
end;
$$;

drop trigger if exists zz_dispatch_like_push on public.likes;
create trigger zz_dispatch_like_push
  after insert on public.likes
  for each row execute function private.dispatch_like_push();

create or replace function private.dispatch_notification_push()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.call_edge_function(
    'notify-generic', private.webhook_payload('notifications', to_jsonb(new))
  );
  return null;
end;
$$;

drop trigger if exists zz_dispatch_notification_push on public.notifications;
create trigger zz_dispatch_notification_push
  after insert on public.notifications
  for each row execute function private.dispatch_notification_push();

-- ============================================================
-- 5. Cron
--
-- pg_cron 은 UTC 로 돈다. 마감 알림은 KST 자정에 보내고 싶으므로 15:00 UTC 다.
-- ============================================================
select cron.schedule(
  'notify-bingo-deadline',
  '0 15 * * *',
  $cron$ select private.call_edge_function('notify-bingo-deadline', '{}'::jsonb) $cron$
);

-- 티켓은 전송 직후에, receipt 는 몇 분 뒤에 확정된다. 30분 간격이면 충분하다.
select cron.schedule(
  'check-push-receipts',
  '*/30 * * * *',
  $cron$ select private.call_edge_function('check-push-receipts', '{}'::jsonb) $cron$
);
