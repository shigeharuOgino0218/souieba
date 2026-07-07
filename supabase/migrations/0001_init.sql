-- 買い物リスト共有アプリ 初期スキーマ
-- Supabase ダッシュボードの SQL Editor に貼り付けて実行するか、
-- `supabase db push` で適用してください。

-- ============================================================
-- テーブル
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.list_members (
  list_id uuid not null references public.lists (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (list_id, user_id)
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (list_id, name)
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  name text not null default '',
  checked boolean not null default false,
  store_id uuid references public.stores (id) on delete set null,
  position double precision not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index items_list_position_idx on public.items (list_id, position);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_by uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

-- ============================================================
-- トリガー
-- ============================================================

-- auth.users 作成時に profiles を自動作成
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- リスト作成時: 作成者を owner としてメンバー登録し、プリセット店舗を seed
create function public.handle_new_list()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.list_members (list_id, user_id, role)
  values (new.id, new.owner_id, 'owner');

  insert into public.stores (list_id, name)
  values (new.id, 'スーパー'), (new.id, 'ドラッグストア'), (new.id, 'コンビニ');

  return new;
end;
$$;

create trigger on_list_created
  after insert on public.lists
  for each row execute function public.handle_new_list();

-- ============================================================
-- RLS
-- ============================================================

-- list_members のポリシーが自身を参照すると無限再帰になるため security definer で判定
create function public.is_list_member(_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.list_members
    where list_id = _list_id and user_id = (select auth.uid())
  );
$$;

alter table public.profiles enable row level security;
alter table public.lists enable row level security;
alter table public.list_members enable row level security;
alter table public.stores enable row level security;
alter table public.items enable row level security;
alter table public.invites enable row level security;

-- profiles: 共有メンバーの表示名を出すため認証済みなら参照可、更新は本人のみ
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);
create policy "profiles_update" on public.profiles
  for update to authenticated using (id = (select auth.uid()));

-- lists
create policy "lists_select" on public.lists
  for select to authenticated using (public.is_list_member(id));
create policy "lists_insert" on public.lists
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "lists_update" on public.lists
  for update to authenticated using (public.is_list_member(id));
create policy "lists_delete" on public.lists
  for delete to authenticated using (owner_id = (select auth.uid()));

-- list_members: 追加はトリガー/RPC(security definer)経由のみ。自分の退会だけ直接可
create policy "list_members_select" on public.list_members
  for select to authenticated using (public.is_list_member(list_id));
create policy "list_members_delete_self" on public.list_members
  for delete to authenticated using (user_id = (select auth.uid()));

-- stores / items: メンバーなら CRUD 可
create policy "stores_all" on public.stores
  for all to authenticated
  using (public.is_list_member(list_id))
  with check (public.is_list_member(list_id));

create policy "items_all" on public.items
  for all to authenticated
  using (public.is_list_member(list_id))
  with check (public.is_list_member(list_id));

-- invites: メンバーのみ発行・閲覧・削除(非メンバーは RPC 経由でのみ token を使う)
create policy "invites_select" on public.invites
  for select to authenticated using (public.is_list_member(list_id));
create policy "invites_insert" on public.invites
  for insert to authenticated
  with check (public.is_list_member(list_id) and created_by = (select auth.uid()));
create policy "invites_delete" on public.invites
  for delete to authenticated using (public.is_list_member(list_id));

-- ============================================================
-- 招待 RPC
-- ============================================================

-- 招待の確認画面用: token からリスト名を返す(非メンバーでも可)
create function public.get_invite_info(invite_token text)
returns table (list_id uuid, list_name text, expired boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select i.list_id, l.name, (i.expires_at < now())
  from public.invites i
  join public.lists l on l.id = i.list_id
  where i.token = invite_token;
$$;

-- 招待の受諾: token を検証してメンバーに追加し list_id を返す
create function public.accept_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  _invite public.invites%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated';
  end if;

  select * into _invite from public.invites where token = invite_token;
  if not found then
    raise exception 'invite_not_found';
  end if;
  if _invite.expires_at < now() then
    raise exception 'invite_expired';
  end if;

  insert into public.list_members (list_id, user_id)
  values (_invite.list_id, (select auth.uid()))
  on conflict (list_id, user_id) do nothing;

  return _invite.list_id;
end;
$$;

revoke execute on function public.accept_invite(text) from anon;

-- ============================================================
-- Realtime
-- ============================================================

-- DELETE/UPDATE イベントに旧行の list_id を含めるため replica identity full
alter table public.items replica identity full;
alter table public.stores replica identity full;

alter publication supabase_realtime add table public.items, public.stores, public.list_members;
