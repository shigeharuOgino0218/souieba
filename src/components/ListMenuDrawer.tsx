import { useState, type ReactElement, type ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import type { List } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { RenameListDrawer } from '@/components/RenameListDrawer'

/**
 * 買い物リストごとの「その他」メニュー。
 * 各項目の操作はこのメニューの上に重ねたドロワーで行い、完了したらメニューごと閉じて元の画面に戻す。
 */
export function ListMenuDrawer({
  list,
  onRenamed,
  trigger,
  children,
}: {
  list: Pick<List, 'id' | 'name'>
  onRenamed: (name: string) => void
  trigger: ReactElement
  children: ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)

  const handleRenamed = (name: string) => {
    onRenamed(name)
    setRenameOpen(false)
    setMenuOpen(false)
  }

  return (
    <Drawer showSwipeHandle={true} open={menuOpen} onOpenChange={setMenuOpen}>
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
        </div>
        <RenameListDrawer
          listId={list.id}
          currentName={list.name}
          open={renameOpen}
          onOpenChange={setRenameOpen}
          onRenamed={handleRenamed}
        />
      </DrawerContent>
    </Drawer>
  )
}
