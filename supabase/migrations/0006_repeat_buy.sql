-- リピ買い: 買ってもリストから消えず、「リピ買い」のドロワーに戻るアイテム。
-- 新しいテーブルは作らず、items の同じ行がリストとドロワーを行き来する。
-- 名前とお店がそのまま引き継がれ、RLS と Realtime も items の設定がそのまま効く。
--
--   repeat  : リピ買いの印
--   shelved : リピ買いのドロワーにしまわれていて、リストには出ていない
--
-- ここにはリピ買いを知らない旧クライアントと共存できる変更だけを置く。
-- 新しい列は既定値 false なので、旧クライアントから見た挙動は変わらない。
-- 既存データの移行と朝の片付けの開始は、新クライアントの公開に合わせて 0007 で行う。

alter table public.items
  add column repeat boolean not null default false,
  add column shelved boolean not null default false,
  add constraint items_shelved_check check (not shelved or (repeat and not checked));

-- ============================================================
-- 通知
-- ============================================================

-- ドロワーに直接登録したアイテムはリストに出ないので、名前が入っても通知しない
drop trigger on_item_named_update on public.items;
drop trigger on_item_named_insert on public.items;

create trigger on_item_named_update
  after update of name on public.items
  for each row
  when (coalesce(old.name, '') = '' and coalesce(new.name, '') <> '' and not new.shelved)
  execute function public.notify_item_named();

create trigger on_item_named_insert
  after insert on public.items
  for each row
  when (coalesce(new.name, '') <> '' and not new.shelved)
  execute function public.notify_item_named();

-- ドロワーからリストに戻したときも、名前を入力したときと同じく「追加」として通知する
create trigger on_item_unshelved
  after update of shelved on public.items
  for each row
  when (old.shelved and not new.shelved and coalesce(new.name, '') <> '')
  execute function public.notify_item_named();

-- ============================================================
-- 買ったものの片付け
-- ============================================================

-- チェック済みのアイテムを片付ける。普通のアイテムは削除し、リピ買いはドロワーに戻す。
-- 毎朝 pg_cron から呼ぶ(スケジュールの登録は 0007)。
-- public スキーマの関数は API から呼べてしまうので、実行権限を外しておく
create function public.sweep_bought_items()
returns void
language sql
set search_path = ''
as $$
  delete from public.items where checked and not repeat;
  update public.items set checked = false, shelved = true where checked and repeat;
$$;

revoke execute on function public.sweep_bought_items() from public, anon, authenticated;
