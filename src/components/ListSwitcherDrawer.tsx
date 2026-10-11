import { useState } from 'react'
import { Check, ChevronDown, Ellipsis, Plus } from 'lucide-react'
import type { List } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { CreateListDrawer } from '@/components/CreateListDrawer'
import { ListMenuDrawer } from '@/components/ListMenuDrawer'

/**
 * ヘッダーに出す選択中のリスト名と、押すと開くリストの切り替えドロワー。
 * 行を押すとそのリストを選んですぐ閉じる。行の右端の「…」はそのリストのメニューをこの上に重ねて開き、
 * 選択は切り替えない。メニューでの操作が終わるとメニューだけ閉じ、この一覧に戻る。
 * 右上の追加ボタンは作成ドロワーをこの上に重ねて開き、作成が終わったら両方とも閉じて新しいリストに切り替える。
 * リストが 0 件のときは固定の文言をトリガーにし、追加ボタンだけのドロワーになる。
 *
 * メニューは行ごとではなく 1 つだけ置き、開いた対象を menuList に持つ。削除や退会で行が消えても、
 * メニューは閉じるアニメーションを最後まで続けられる。
 */
export function ListSwitcherDrawer({
  lists,
  activeId,
  onSelect,
  onCreated,
  onRenamed,
  onRemoved,
}: {
  lists: List[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreated: (list: List) => void
  onRenamed: (id: string, name: string) => void
  onRemoved: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [menuList, setMenuList] = useState<List | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
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

  const openMenu = (list: List) => {
    setMenuList(list)
    setMenuOpen(true)
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
            <div key={list.id} className="flex items-center gap-1">
              <Button
                variant="ghost"
                className="h-12 min-w-0 flex-1 justify-start gap-3 text-base"
                aria-current={list.id === activeId ? 'true' : undefined}
                onClick={() => handleSelect(list.id)}
              >
                <Check
                  className={cn(
                    'size-5 shrink-0 text-primary',
                    list.id !== activeId && 'invisible',
                  )}
                />
                <span className="truncate">{list.name}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-12 shrink-0 text-muted-foreground"
                aria-label={`${list.name}のメニュー`}
                onClick={() => openMenu(list)}
              >
                <Ellipsis className="size-5" />
              </Button>
            </div>
          ))}
        </div>
        <CreateListDrawer
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={handleCreated}
        />
        {menuList && (
          <ListMenuDrawer
            list={menuList}
            open={menuOpen}
            onOpenChange={setMenuOpen}
            onRenamed={(name) => {
              onRenamed(menuList.id, name)
              setMenuList({ ...menuList, name })
            }}
            onRemoved={() => onRemoved(menuList.id)}
          />
        )}
      </DrawerContent>
    </Drawer>
  )
}
