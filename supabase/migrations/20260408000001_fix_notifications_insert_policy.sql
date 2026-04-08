-- notifications INSERT 시 auth.uid() = user_id 조건이 적용되어
-- 타인에게 알림(배틀 요청, 친구 요청 등)을 삽입할 수 없는 문제 수정

drop policy if exists "notifications: 본인만" on public.notifications;

-- SELECT / UPDATE / DELETE: 본인 알림만
create policy "notifications: 본인 조회·수정·삭제" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications: 본인 수정" on public.notifications
  for update using (auth.uid() = user_id);

create policy "notifications: 본인 삭제" on public.notifications
  for delete using (auth.uid() = user_id);

-- INSERT: 로그인된 사용자라면 누구에게든 알림 삽입 가능
create policy "notifications: 인증된 사용자 삽입" on public.notifications
  for insert with check (auth.uid() is not null);
