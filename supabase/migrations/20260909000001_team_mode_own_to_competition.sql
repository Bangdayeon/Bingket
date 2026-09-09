-- 팀 모드 'own' → 'competition' 이름 변경.
--
-- 시안이 모드를 '함께하기'(shared) / '경쟁하기'(competition) 둘로 정리하면서
-- 'own'이라는 이름이 화면 문구와 어긋나게 됐다. 값 이름만 바꾸고 동작은 그대로다.
--
-- 다른 함수·정책은 전부 `mode = 'shared'`만 보고 있어 영향이 없다.
-- 'copied'는 이미 만들어진 팀이 남아 있어 값 자체는 유지한다 (새로 만들 수는 없다).

-- 1) 'own'을 언급하는 체크 제약을 이름에 기대지 않고 걷어낸다.
--    인라인으로 선언한 제약은 이름이 자동 생성돼서, 이름을 찍어 지우면
--    환경에 따라 남아 있을 수 있고 그러면 아래 UPDATE가 막힌다.
do $$
declare
  c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'team_bingos'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) like '%''own''%'
  loop
    execute format('alter table public.team_bingos drop constraint %I', c.conname);
  end loop;
end $$;

-- 2) 기존 행 이관
update public.team_bingos set mode = 'competition' where mode = 'own';

-- 3) 새 제약
alter table public.team_bingos
  add constraint team_bingos_mode_check
  check (mode in ('shared', 'copied', 'competition'));

-- 내기(bet_text)는 경쟁하기에만 있다
alter table public.team_bingos
  add constraint team_bingos_bet_only_competition
  check (mode = 'competition' or bet_text is null);

comment on table public.team_bingos is
  '팀 빙고 (shared: 한 판 공유 | competition: 각자 다른 내용으로 경쟁 | copied: 레거시, 같은 내용 복사)';
