-- オーナーが自分のメンバー行を消してリストから抜けることを禁止する。
-- オーナーが抜けても lists_select の owner_id 条件でリストは見え続け、
-- メンバー一覧にいないオーナーという中途半端な状態になるため。
-- オーナーがリストを手放す手段は削除のみとし、メンバー行は lists の cascade で消える
-- (cascade は RLS の対象外なのでこのポリシーには影響されない)。

drop policy "list_members_delete_self" on public.list_members;

create policy "list_members_delete_self" on public.list_members
  for delete to authenticated
  using (user_id = (select auth.uid()) and role <> 'owner');
