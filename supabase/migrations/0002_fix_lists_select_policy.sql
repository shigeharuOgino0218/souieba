-- リスト作成の INSERT ... RETURNING が 42501 で失敗する問題の修正。
-- 作成者のメンバー登録は AFTER INSERT トリガーで行われるが、RETURNING 行の
-- SELECT ポリシー評価はトリガーより先に走るため、is_list_member(id) だけでは
-- 作成直後の行を返せない。オーナー本人は常に参照可とする。

drop policy "lists_select" on public.lists;

create policy "lists_select" on public.lists
  for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_list_member(id));
