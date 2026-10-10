import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

/**
 * 買い物リストから抜けるのを確認するドロワー。開閉は呼び出し元が制御する。
 * 自分のメンバー行を消すだけで、自分が追加したアイテムはリストに残す。
 * オーナーは抜けられない(RLS の list_members_delete_self)ので、呼び出し元はメンバーにだけ開かせる。
 * DB の削除が成功してから onLeft を呼び、失敗したら開いたままエラーを出す。
 */
export function LeaveListDrawer({
  listId,
  listName,
  open,
  onOpenChange,
  onLeft,
}: {
  listId: string
  listName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onLeft: () => void
}) {
  const { session } = useAuth()
  const [leaving, setLeaving] = useState(false)

  const handleLeave = async () => {
    if (!session) return
    setLeaving(true)
    const { error } = await supabase
      .from('list_members')
      .delete()
      .eq('list_id', listId)
      .eq('user_id', session.user.id)
    setLeaving(false)
    if (error) {
      toast.error('リストから抜けられませんでした')
      return
    }
    toast.success('リストから抜けました')
    onLeft()
  }

  return (
    <Drawer showSwipeHandle={true} open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="truncate">
            「{listName}」から抜けますか?
          </DrawerTitle>
          <DrawerDescription>
            このリストが表示されなくなります。もう一度参加するには招待リンクが必要です。
          </DrawerDescription>
        </DrawerHeader>
        <div className="grid gap-2 px-4 pb-6">
          <Button
            variant="destructive"
            disabled={leaving}
            onClick={() => void handleLeave()}
          >
            {leaving ? '処理中…' : '抜ける'}
          </Button>
          <DrawerClose render={<Button variant="ghost" />}>
            キャンセル
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
