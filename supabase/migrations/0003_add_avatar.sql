alter table public.profiles
  add column avatar_icon text not null default 'user-round',
  add column avatar_color text not null default 'stone';
