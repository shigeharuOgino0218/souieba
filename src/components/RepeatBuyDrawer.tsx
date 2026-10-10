import { useState, type SubmitEvent } from 'react'
import { Check, Pencil, Repeat, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { groupByStore } from '@/lib/repeat'
import type { Item, Store } from '@/lib/types'
import { cn } from '@/lib/utils'

type Props = {
  items: Item[]
  stores: Store[]
  onRestore: (id: string) => void
  onShelve: (id: string) => void
  onAdd: (name: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

/**
 * 下のバーから開くリピ買いのドロワー。リピ買いの印が付いたアイテムを、お店ごとにまとめて並べる。
 *
 * 品をタップするとリストの末尾に戻し、リストに出ている品(✓ 付き)をもう一度タップすると取り消してしまう。
 * 上の入力欄は検索を兼ね、まだ無い名前ならリストには出さずにリピ買いへ直接登録する。
 * 「編集」に切り替えると、品のタップで名前の変更と削除のドロワーを開く。
 */
export function RepeatBuyDrawer({
  items,
  stores,
  onRestore,
  onShelve,
  onAdd,
  onRename,
  onDelete,
}: Props) {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null)
  const [editName, setEditName] = useState('')
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)

  const trimmed = search.trim()
  const canCreate = trimmed !== '' && !items.some((i) => i.name === trimmed)
  const filtered =
    trimmed === ''
      ? items
      : items.filter((i) =>
          i.name.toLowerCase().includes(trimmed.toLowerCase()),
        )
  const groups = groupByStore(filtered, stores)

  const handleCreate = () => {
    onAdd(trimmed)
    setSearch('')
  }

  const handleTap = (item: Item) => {
    if (editing) {
      setItemToEdit(item)
      setEditName(item.name)
    } else if (item.shelved) {
      onRestore(item.id)
    } else {
      onShelve(item.id)
    }
  }

  const handleRename = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!itemToEdit) return
    const name = editName.trim()
    if (!name) return
    if (name !== itemToEdit.name) onRename(itemToEdit.id, name)
    setItemToEdit(null)
  }

  return (
    <Drawer
      showSwipeHandle={true}
      onOpenChange={(next) => {
        if (!next) {
          setSearch('')
          setEditing(false)
        }
      }}
    >
      <DrawerTrigger
        render={
          <Button
            variant="outline"
            size="lg"
            className="!bg-background dark:!bg-muted"
          />
        }
      >
        <Repeat data-icon="inline-start" />
        <span className="text-trim">リピ買い</span>
      </DrawerTrigger>
      <DrawerContent initialFocus={false}>
        <DrawerHeader>
          <DrawerTitle>リピ買い</DrawerTitle>
        </DrawerHeader>
        <div className="grid gap-4 overflow-y-auto px-4 pb-6">
          <div className="flex items-center gap-2 p-1">
            <Input
              placeholder="リピ買いを追加 or 検索"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 leading-none"
            />
            <Button
              size="lg"
              variant={canCreate ? 'default' : 'outline'}
              onClick={handleCreate}
              disabled={!canCreate}
              className="shrink-0"
            >
              追加
            </Button>
          </div>
          {items.length === 0 ? (
            <p className="py-6 text-xs text-muted-foreground">
              ここに登録したものは、買ったあともここに戻ります
            </p>
          ) : groups.length === 0 ? (
            <p className="py-6 text-xs">リピ買いが見つかりません</p>
          ) : (
            groups.map((group) => (
              <section key={group.store?.id ?? 'none'} className="grid gap-2">
                <h3 className="px-1 text-xs text-muted-foreground">
                  {group.store?.name ?? 'お店未選択'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => {
                    const onList = !item.shelved
                    return (
                      <Button
                        key={item.id}
                        variant="outline"
                        size="sm"
                        aria-pressed={editing ? undefined : onList}
                        className={cn(
                          !editing && onList && 'border-primary !bg-secondary',
                        )}
                        onClick={() => handleTap(item)}
                      >
                        {editing ? (
                          <Pencil data-icon="inline-start" />
                        ) : (
                          onList && <Check data-icon="inline-start" />
                        )}
                        <span className="text-trim">{item.name}</span>
                      </Button>
                    )
                  })}
                </div>
              </section>
            ))
          )}
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto w-fit"
              onClick={() => setEditing((prev) => !prev)}
            >
              {editing ? (
                <Check data-icon="inline-start" />
              ) : (
                <Pencil data-icon="inline-start" />
              )}
              <span className="text-trim">{editing ? '完了' : '編集'}</span>
            </Button>
          )}
        </div>

        <Drawer
          open={!!itemToEdit}
          onOpenChange={(next) => {
            if (!next) setItemToEdit(null)
          }}
          showSwipeHandle={true}
        >
          <DrawerContent initialFocus={false}>
            <DrawerHeader>
              <DrawerTitle>"{itemToEdit?.name}"を編集</DrawerTitle>
            </DrawerHeader>
            <form
              onSubmit={handleRename}
              className="grid gap-5 overflow-y-auto px-4"
            >
              <div className="flex items-center gap-2">
                <Input
                  placeholder="アイテムの名前"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 leading-none"
                />
                <Button
                  type="submit"
                  size="lg"
                  variant={editName.trim() !== '' ? 'default' : 'outline'}
                  disabled={editName.trim() === ''}
                  className="shrink-0"
                >
                  保存
                </Button>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="mx-auto w-fit"
                onClick={() => setItemToDelete(itemToEdit)}
              >
                <Trash2 data-icon="inline-start" />
                <span className="text-trim">削除</span>
              </Button>
            </form>

            <Drawer
              open={!!itemToDelete}
              onOpenChange={(next) => {
                if (!next) setItemToDelete(null)
              }}
              showSwipeHandle={true}
            >
              <DrawerContent initialFocus={false}>
                <DrawerHeader>
                  <DrawerTitle>
                    "{itemToDelete?.name}"を削除しますか?
                  </DrawerTitle>
                  <DrawerDescription>
                    リピ買いから消えます。リストに出ている場合は、リストからも消えます。
                  </DrawerDescription>
                </DrawerHeader>
                <div className="mx-auto flex w-64 flex-col gap-2 px-4">
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={() => {
                      if (itemToDelete) onDelete(itemToDelete.id)
                      setItemToDelete(null)
                      setItemToEdit(null)
                    }}
                  >
                    削除
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => setItemToDelete(null)}
                  >
                    キャンセル
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>
          </DrawerContent>
        </Drawer>
      </DrawerContent>
    </Drawer>
  )
}
