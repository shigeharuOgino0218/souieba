import { useState } from 'react'
import { Check, ChevronDown, Plus } from 'lucide-react'
import type { List } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { CreateListDrawer } from '@/components/CreateListDrawer'

/**
 * ヘッダーに出す選択中のリスト名と、押すと開くリストの切り替えドロワー。
 * リストを選ぶとすぐ閉じる。右上の追加ボタンは作成ドロワーをこの上に重ねて開き、
 * 作成が終わったら両方とも閉じて新しいリストに切り替える。
 * リストが 0 件のときは固定の文言をトリガーにし、追加ボタンだけのドロワーになる。
 */
export function ListSwitcherDrawer({
  lists,
  activeId,
  onSelect,
  onCreated,
}: {
  lists: List[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreated: (list: List) => void
}) {
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const active = lists.find((l) => l.id === activeId)

  const handleSelect = (id: string) => {
    onSelect(id)
    setOpen(false)
  }

  const handleCreated = (list: List) => {
    onCreated(list)
    setCreateOpen(false)
    setOpen(false)
  }

  return (
    <Drawer showSwipeHandle={true} open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        render={
          <Button
            variant="ghost"
            className="h-10 max-w-full min-w-0 gap-1 px-2 text-lg font-bold"
            aria-label="買い物リストを切り替える"
          />
        }
      >
        <span className="truncate">{active?.name ?? '買い物リスト'}</span>
        <ChevronDown strokeWidth={3} className="size-4 shrink-0" />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="flex-row items-center justify-between gap-4 text-left group-data-[swipe-axis=y]/drawer-popup:text-left">
          <DrawerTitle>買い物リスト</DrawerTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            <Plus data-icon="inline-start" />
            買い物リストを追加
          </Button>
        </DrawerHeader>
        <div className="grid min-h-0 overflow-y-auto px-4 pb-6">
          {lists.map((list) => (
            <Button
              key={list.id}
              variant="ghost"
              className="h-12 justify-start gap-3 text-base"
              aria-current={list.id === activeId ? 'true' : undefined}
              onClick={() => handleSelect(list.id)}
            >
              <span className="truncate">{list.name}</span>
              {list.id === activeId && (
                <Check className="ml-auto size-5 shrink-0 text-primary" />
              )}
            </Button>
          ))}
        </div>
        <CreateListDrawer
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={handleCreated}
        />
      </DrawerContent>
    </Drawer>
  )
}
