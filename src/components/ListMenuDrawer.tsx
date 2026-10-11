import { useRef, useState } from 'react'
import { LogOut, Pencil, Trash2, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { List } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { RenameListDrawer } from '@/components/RenameListDrawer'
import { MembersDrawer } from '@/components/MembersDrawer'
import { DeleteListDrawer } from '@/components/DeleteListDrawer'
import { LeaveListDrawer } from '@/components/LeaveListDrawer'

const DESTRUCTIVE_ITEM =
  'h-12 justify-start gap-3 text-base text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20'

/**
 * 買い物リストごとの「その他」メニュー。開閉は呼び出し元が制御し、リストの切り替えドロワーの上に重ねて開く。
 * 各項目の操作はこのメニューの上にさらに重ねたドロワーで行い、完了したらメニューまで閉じて切り替えドロワーに戻す。
 *
 * 末尾の項目はオーナーなら「リストを削除」、メンバーなら「リストから抜ける」のどちらか一方を出す。
 * どちらの場合もリストは呼び出し元で取り除かれる。メニューが閉じ切ってから onRemoved を呼び、
 * 一覧から行が消えるのをメニューが下りたあとに見せる。
 */
export function ListMenuDrawer({
  list,
  open,
  onOpenChange,
  onRenamed,
  onRemoved,
}: {
  list: Pick<List, 'id' | 'name' | 'owner_id'>
  open: boolean
  onOpenChange: (open: boolean) => void
  onRenamed: (name: string) => void
  onRemoved: () => void
}) {
  const { session } = useAuth()
  const [renameOpen, setRenameOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const removedRef = useRef(false)
  const isOwner = session?.user.id === list.owner_id

  const handleRenamed = (name: string) => {
    onRenamed(name)
    setRenameOpen(false)
    onOpenChange(false)
  }

  const handleRemoved = () => {
    removedRef.current = true
    setDeleteOpen(false)
    setLeaveOpen(false)
    onOpenChange(false)
  }

  const handleOpenChangeComplete = (open: boolean) => {
    if (open || !removedRef.current) return
    removedRef.current = false
    onRemoved()
  }

  return (
    <Drawer
      showSwipeHandle={true}
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="truncate">{list.name}</DrawerTitle>
        </DrawerHeader>
        <div className="grid px-4 pb-6">
          <Button
            variant="ghost"
            className="h-12 justify-start gap-3 text-base"
            onClick={() => setRenameOpen(true)}
          >
            <Pencil data-icon="inline" className="size-5" />
            名前を変更
          </Button>
          <Button
            variant="ghost"
            className="h-12 justify-start gap-3 text-base"
            onClick={() => setMembersOpen(true)}
          >
            <Users data-icon="inline" className="size-5" />
            メンバー
          </Button>
          <Separator className="my-1" />
          {isOwner ? (
            <Button
              variant="ghost"
              className={DESTRUCTIVE_ITEM}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 data-icon="inline" className="size-5" />
              リストを削除
            </Button>
          ) : (
            <Button
              variant="ghost"
              className={DESTRUCTIVE_ITEM}
              onClick={() => setLeaveOpen(true)}
            >
              <LogOut data-icon="inline" className="size-5" />
              リストから抜ける
            </Button>
          )}
        </div>
        <RenameListDrawer
          listId={list.id}
          currentName={list.name}
          open={renameOpen}
          onOpenChange={setRenameOpen}
          onRenamed={handleRenamed}
        />
        <MembersDrawer
          listId={list.id}
          open={membersOpen}
          onOpenChange={setMembersOpen}
        />
        {isOwner ? (
          <DeleteListDrawer
            listId={list.id}
            listName={list.name}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onDeleted={handleRemoved}
          />
        ) : (
          <LeaveListDrawer
            listId={list.id}
            listName={list.name}
            open={leaveOpen}
            onOpenChange={setLeaveOpen}
            onLeft={handleRemoved}
          />
        )}
      </DrawerContent>
    </Drawer>
  )
}
