-- Web Push 通知: 共有リストの他メンバーがアイテム名を入力したら通知する
-- Supabase ダッシュボードの SQL Editor に貼り付けて実行してください。

create extension if not exists pg_net;

-- ============================================================
-- テーブル
-- ============================================================

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- まとめ通知(「〇〇さんが3件追加しました」)を組み立てるための直近履歴
create table public.push_events (
  id bigint generated always as identity primary key,
  list_id uuid not null references public.lists (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index push_events_recent_idx
  on public.push_events (list_id, actor_id, created_at desc);

-- ============================================================
-- RLS
-- ============================================================

alter table public.push_subscriptions enable row level security;

-- insert/update は save_push_subscription(security definer)経由のみ
create policy "push_subscriptions_select" on public.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "push_subscriptions_delete" on public.push_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));

-- ポリシーを作らない = service_role 以外からは不可視
alter table public.push_events enable row level security;

-- ============================================================
-- 購読の保存 RPC
-- ============================================================

-- 同じ端末を別アカウントで使うと endpoint の衝突行が他人の行になり、
-- クライアントからの upsert は RLS で弾かれるため security definer で引き取る
create function public.save_push_subscription(
  _endpoint text,
  _p256dh text,
  _auth text,
  _user_agent text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  values ((select auth.uid()), _endpoint, _p256dh, _auth, _user_agent)
  on conflict (endpoint) do update
    set user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        user_agent = excluded.user_agent,
        updated_at = now();
end;
$$;

revoke execute on function public.save_push_subscription(text, text, text, text) from anon;

-- ============================================================
-- アイテム名が入力されたら Edge Function を呼ぶ
-- ============================================================

create function public.notify_item_named()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  _actor uuid;
  _url text;
  _secret text;
begin
  -- addItem は空行を先に INSERT するため、行を作った人(created_by)ではなく
  -- 名前を入力した人を通知の主語にしないと送信者と除外対象が逆転する
  _actor := coalesce((select auth.uid()), new.created_by);
  if _actor is null then
    return new;
  end if;

  insert into public.push_events (list_id, item_id, actor_id)
  values (new.list_id, new.id, _actor);

  select decrypted_secret into _url
    from vault.decrypted_secrets where name = 'notify_item_added_url';
  select decrypted_secret into _secret
    from vault.decrypted_secrets where name = 'notify_shared_secret';
  if _url is null or _secret is null then
    return new;
  end if;

  perform net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-notify-secret', _secret
    ),
    body := jsonb_build_object(
      'list_id', new.list_id,
      'item_id', new.id,
      'actor_id', _actor
    ),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

-- update of name + when 句なので、チェック/店舗/並び順の更新では関数自体が呼ばれない
create trigger on_item_named_update
  after update of name on public.items
  for each row
  when (coalesce(old.name, '') = '' and coalesce(new.name, '') <> '')
  execute function public.notify_item_named();

-- 将来 name 付きで INSERT する経路が増えても取りこぼさない
create trigger on_item_named_insert
  after insert on public.items
  for each row
  when (coalesce(new.name, '') <> '')
  execute function public.notify_item_named();

-- ============================================================
-- Vault シークレット
-- ============================================================

-- 実値はコミットしないため、以下を SQL Editor で個別に実行してください。
--
-- select vault.create_secret(
--   'https://<project-ref>.supabase.co/functions/v1/notify-item-added',
--   'notify_item_added_url', 'Edge Function endpoint');
--
-- select vault.create_secret(
--   '<openssl rand -base64 32 の値>',
--   'notify_shared_secret', 'Edge Function 共有シークレット');
--
-- 値を入れ替える場合:
-- select vault.update_secret(
--   (select id from vault.secrets where name = 'notify_shared_secret'),
--   '<new value>', 'notify_shared_secret', '');
