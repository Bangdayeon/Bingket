insert into public.bingo_themes (id, display_name, grid_3x3_url, grid_4x3_url, grid_4x4_url, check_url, foreground_color)
values
  (
    'default', '기본',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/default/default_3x3.png',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/default/default_4x3.png',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/default/default_4x4.png',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/default/default_check.png',
    '#181C1C'
  ),
  (
    'rabbit', '토끼',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/rabbit/rabbit_3x3.png',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/rabbit/rabbit_4x3.png',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/rabbit/rabbit_4x4.png',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/rabbit/rabbit_check.png',
    '#181C1C'
  ),
  (
    'red_horse', '붉은말',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/red_horse/red_horse_3x3.png',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/red_horse/red_horse_4x3.png',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/red_horse/red_horse_4x4.png',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/red_horse/red_horse_check.png',
    '#181C1C'
  ),
  (
    'square_cat', '고먐미',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/square_cat/square_cat_3x3.png',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/square_cat/square_cat_4x3.png',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/square_cat/square_cat_4x4.png',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/square_cat/square_cat_check.png',
    '#181C1C'
  ),
  (
    'pig', '돼지',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/pig/pig_3x3.png',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/pig/pig_4x3.png',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/pig/pig_4x4.png',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/pig/pig_check.png',
    '#181C1C'
  ),
  (
    'midnight', '미드나잇',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/midnight/midnight_3x3.png',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/midnight/midnight_4x3.png',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/midnight/midnight_4x4.png',
    'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev/bingo_themes/midnight/midnight_check.png',
    '#181C1C'
  )
on conflict (id) do nothing;
