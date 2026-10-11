-- 献立: リストごとに、日付 × 朝・昼・夜の1コマへ自由に書いたテキストを1つ持つ。
-- コマは (list_id, date, slot) で一意なので、書き込みは upsert で行い、中身を空にしたら行を削除する。
-- 過ぎた日の行は消さずに残し、画面が昨日以降の日付だけを読む。
-- 新しいテーブルを足すだけなので、献立を知らない旧クライアントには影響しない。

create table public.meals (
  list_id uuid not null references public.lists (id) on delete cascade,
  date date not null,
  slot text not null check (slot in ('breakfast', 'lunch', 'dinner')),
  body text not null,
  primary key (list_id, date, slot)
);

alter table public.meals enable row level security;

-- メンバーなら CRUD 可。list_members を直接参照すると再帰するため is_list_member() を通す
create policy "meals_all" on public.meals
  for all to authenticated
  using (public.is_list_member(list_id))
  with check (public.is_list_member(list_id));

-- DELETE イベントに旧行の list_id を含めるため replica identity full
alter table public.meals replica identity full;

alter publication supabase_realtime add table public.meals;
