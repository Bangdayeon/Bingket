alter table public.bingo_themes
  add column names jsonb not null default '{}'::jsonb,
  add column sort_order int not null default 0,
  add column is_active boolean not null default true;

update public.bingo_themes t
set names = v.names, sort_order = v.sort_order
from (values
  ('default', '{"ko":"기본","en":"Default","ja":"デフォルト","es":"Predeterminado","fr":"Par défaut"}'::jsonb, 0),
  ('rabbit', '{"ko":"토끼","en":"Rabbit","ja":"うさぎ","es":"Conejo","fr":"Lapin"}'::jsonb, 1),
  ('red_horse', '{"ko":"붉은 말","en":"Red Horse","ja":"赤い馬","es":"Caballo rojo","fr":"Cheval rouge"}'::jsonb, 2),
  ('square_cat', '{"ko":"고먐미","en":"Square Cat","ja":"四角いねこ","es":"Gato cuadrado","fr":"Chat carré"}'::jsonb, 3),
  ('pig', '{"ko":"돼지","en":"Pig","ja":"ぶた","es":"Cerdito","fr":"Cochon"}'::jsonb, 4),
  ('midnight', '{"ko":"미드나잇","en":"Midnight","ja":"ミッドナイト","es":"Medianoche","fr":"Minuit"}'::jsonb, 5)
) as v(id, names, sort_order)
where t.id = v.id;

drop policy if exists "bingo_themes: 누구나 조회" on public.bingo_themes;
create policy "bingo_themes: 누구나 조회"
on public.bingo_themes for select using (is_active);
