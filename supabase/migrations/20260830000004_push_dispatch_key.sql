-- ============================================================
-- pg_net 이 엣지 함수에 실을 Bearer 를 전용 키로 바꾼다
--
-- 20260830000003 은 vault 의 'service_role_key' 를 그대로 실었다. 그런데 이 프로젝트의
-- 엣지 함수 런타임에 주입된 SUPABASE_SERVICE_ROLE_KEY 가 Management API 가 돌려주는
-- service_role 키와 일치하지 않아, 올바른 키로 호출해도 함수가 401 을 냈다.
-- (2026-08-30 확인. 호출자가 DB 트리거라 이 401 은 어디에도 드러나지 않는다)
--
-- 플랫폼이 주입하는 이름에 기대지 않고 우리가 발급한 키를 양쪽에 둔다.
--   엣지 함수: supabase secrets set PUSH_DISPATCH_KEY=<임의값>
--   DB       : vault 의 push_dispatch_key   (아래 set_push_config 로 주입)
-- ============================================================

-- 이름을 바꾼다. 예전 이름은 "service_role 키" 라는 틀린 뜻을 담고 있었다.
create or replace function private.call_edge_function(p_function text, p_body jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_url    text;
  v_key    text;
  v_schema text;
begin
  -- 함수 전체를 예외 가드로 감싼다. 이 함수는 댓글 작성 같은 사용자 트랜잭션 안에서
  -- 트리거로 불린다. 여기서 예외가 새어 나가면 댓글 자체가 롤백된다.
  begin
    -- 한 사건이 알림 여러 건을 만들 수 있다 (팀 종료 → 멤버 수만큼).
    -- Vault 복호화와 카탈로그 조회를 행마다 반복하지 않도록 트랜잭션 안에서만 캐시한다.
    v_url    := nullif(current_setting('bingket.push_url', true), '');
    v_key    := nullif(current_setting('bingket.push_key', true), '');
    v_schema := nullif(current_setting('bingket.push_net_schema', true), '');

    if v_url is null or v_key is null then
      select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
      select decrypted_secret into v_key
        from vault.decrypted_secrets where name = 'push_dispatch_key';

      if v_url is null or v_key is null then
        raise warning '[push] vault 에 project_url / push_dispatch_key 가 없어 % 호출을 건너뜁니다', p_function;
        return;
      end if;

      perform set_config('bingket.push_url', v_url, true);
      perform set_config('bingket.push_key', v_key, true);
    end if;

    if v_schema is null then
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

-- p_key 는 이제 service_role 키가 아니라 우리가 발급한 dispatch 키다.
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

  select id into v_id from vault.secrets where name = 'push_dispatch_key';
  if v_id is null then
    perform vault.create_secret(p_key, 'push_dispatch_key',
      '엣지 함수의 PUSH_DISPATCH_KEY 와 같은 값이어야 한다');
  else
    perform vault.update_secret(v_id, p_key);
  end if;

  -- 예전 이름으로 저장된 service_role 키는 더 쓰이지 않는다. 남겨두면 오해를 부른다.
  delete from vault.secrets where name = 'service_role_key';
end;
$$;

revoke all on function public.set_push_config(text, text) from public, anon, authenticated;
grant execute on function public.set_push_config(text, text) to service_role;
