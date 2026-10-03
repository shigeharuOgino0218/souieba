import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
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
 * 買い物リストの削除を確認するドロワー。開閉は呼び出し元が制御する。
 * 削除できるのはオーナーだけ(RLS の lists_delete)なので、呼び出し元はオーナーにだけ開かせる。
 * DB の削除が成功してから onDeleted を呼び、失敗したら開いたままエラーを出す。
 */
export function DeleteListDrawer({
  listId,
  listName,
  open,
  onOpenChange,
  onDeleted,
}: {
  listId: string
  listName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase.from('lists').delete().eq('id', listId)
    setDeleting(false)
    if (error) {
      toast.error('リストの削除に失敗しました')
      return
    }
    toast.success('リストを削除しました')
    onDeleted()
  }

  return (
    <Drawer showSwipeHandle={true} open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="truncate">
            「{listName}」を削除しますか?
          </DrawerTitle>
          <DrawerDescription>
            リスト内のアイテム・お店・メンバー情報もすべて削除されます。この操作は取り消せません。
          </DrawerDescription>
        </DrawerHeader>
        <div className="grid gap-2 px-4 pb-6">
          <Button
            variant="destructive"
            disabled={deleting}
            onClick={() => void handleDelete()}
          >
            {deleting ? '削除中…' : '削除する'}
          </Button>
          <DrawerClose render={<Button variant="ghost" />}>
            キャンセル
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
