-- ============================================================
-- 강제 업데이트 게이트용 최소 버전
--
-- app.json 에 updates.enabled: false 라 OTA 가 없다. 구버전 앱을 고칠
-- 유일한 방법이 스토어 재설치인데, 지금은 그걸 알릴 수단이 아무것도 없다.
-- 서버 정책을 조이는 변경(레거시 RLS 정리)을 올리면 구버전 앱 화면이
-- 조용히 깨지므로, 그 전에 "이 버전 미만은 막는다" 를 서버에 둔다.
--
-- 앱 릴리스 없이 값만 바꿔야 의미가 있으므로 테이블로 만든다.
-- 플랫폼을 나누는 이유는 심사 통과 시점이 스토어마다 다르기 때문이다.
-- 하나로 묶으면 한쪽 심사가 밀렸을 때 아직 받을 수 없는 버전을 요구하게 된다.
-- ============================================================

create table public.app_config (
  platform     text primary key check (platform in ('ios', 'android')),
  min_version  text not null,
  updated_at   timestamptz not null default now()
);

comment on table public.app_config is
  '앱 강제 업데이트 기준. 값 변경은 대시보드(service_role)에서만 한다';
comment on column public.app_config.min_version is
  '이 버전 미만이면 앱 진입을 막는다. 점으로 구분된 숫자 (예: 1.0.7)';

-- 시드는 1.0.0 -- 현재 배포 버전이 1.0.7 이므로 아무도 차단되지 않는다.
-- 게이트가 포함된 버전이 충분히 보급된 뒤에 이 값을 올려야 한다.
-- 게이트를 넣자마자 사용자를 막아버리는 사고를 피하려고 낮게 시작한다.
insert into public.app_config (platform, min_version) values
  ('ios',     '1.0.0'),
  ('android', '1.0.0');

alter table public.app_config enable row level security;

-- 로그인 전 화면에서도 검사해야 하므로 anon 도 읽을 수 있어야 한다.
-- (bingo_themes 와 같은 패턴)
create policy "app_config: 누구나 조회" on public.app_config
  for select using (true);

-- insert / update / delete 정책은 만들지 않는다.
-- RLS 가 켜져 있고 정책이 없으면 anon / authenticated 는 쓸 수 없다.
