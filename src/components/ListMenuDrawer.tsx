import { useRef, useState, type ReactElement, type ReactNode } from 'react'
import { Pencil, Trash2, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { List } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { RenameListDrawer } from '@/components/RenameListDrawer'
import { MembersDrawer } from '@/components/MembersDrawer'
import { DeleteListDrawer } from '@/components/DeleteListDrawer'

/**
 * 買い物リストごとの「その他」メニュー。
 * 各項目の操作はこのメニューの上に重ねたドロワーで行い、完了したらメニューごと閉じて元の画面に戻す。
 *
 * 削除されたリストのタブは呼び出し元で取り除かれ、このメニュー自体もアンマウントされる。
 * 閉じるアニメーションの途中で消えないよう、onDeleted はメニューが閉じ切ってから呼ぶ。
 */
export function ListMenuDrawer({
  list,
  onRenamed,
  onDeleted,
  trigger,
  children,
}: {
  list: Pick<List, 'id' | 'name' | 'owner_id'>
  onRenamed: (name: string) => void
  onDeleted: () => void
  trigger: ReactElement
  children: ReactNode
}) {
  const { session } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deletedRef = useRef(false)
  const isOwner = session?.user.id === list.owner_id

  const handleRenamed = (name: string) => {
    onRenamed(name)
    setRenameOpen(false)
    setMenuOpen(false)
  }

  const handleDeleted = () => {
    deletedRef.current = true
    setDeleteOpen(false)
    setMenuOpen(false)
  }

  const handleOpenChangeComplete = (open: boolean) => {
    if (!open && deletedRef.current) onDeleted()
  }

  return (
    <Drawer
      showSwipeHandle={true}
      open={menuOpen}
      onOpenChange={setMenuOpen}
      onOpenChangeComplete={handleOpenChangeComplete}
    >
      <DrawerTrigger render={trigger}>{children}</DrawerTrigger>
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
          {isOwner && (
            <>
              <Separator className="my-1" />
              <Button
                variant="ghost"
                className="h-12 justify-start gap-3 text-base text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 data-icon="inline" className="size-5" />
                リストを削除
              </Button>
            </>
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
        {isOwner && (
          <DeleteListDrawer
            listId={list.id}
            listName={list.name}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onDeleted={handleDeleted}
          />
        )}
      </DrawerContent>
    </Drawer>
  )
}
