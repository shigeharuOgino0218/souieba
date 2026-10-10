import { useState, type SubmitEvent } from 'react'
import { Check, CircleCheck, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useActiveListData } from '@/hooks/useLists'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { ListBodySkeleton } from '@/components/ListHeader'
import { groupByStore } from '@/lib/repeat'
import type { Item } from '@/lib/types'

/**
 * リピ買いのタブの本体。リピ買いの印が付いたアイテムを、お店ごとにまとめて並べる。
 *
 * しまわれている品はタップで選び、下の「買い物リストに登録」でまとめてリストの末尾に戻す。
 * リストに出ている品(✓ 付き)はタップするとすぐリストから外す。選択とは別の操作なので、見た目も分ける。
 * 上の入力欄は検索を兼ね、まだ無い名前ならリストには出さずにリピ買いへ直接登録する。
 * 「編集」に切り替えると、品のタップで名前の変更と削除のドロワーを開く。そのあいだは選択できない。
 */
export function RepeatBuyEditor() {
  const {
    items,
    stores,
    loading,
    shelveItem,
    unshelveItems,
    addRepeatItem,
    updateItemName,
    deleteItem,
  } = useActiveListData()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set())
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null)
  const [editName, setEditName] = useState('')
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)

  const repeatItems = items.filter((i) => i.repeat)
  // 選んだあとに他のメンバーがリストに戻した・消した品は、選択から外して数える
  const selectedItems = repeatItems.filter(
    (i) => i.shelved && selectedIds.has(i.id),
  )

  const trimmed = search.trim()
  const canCreate =
    trimmed !== '' && !repeatItems.some((i) => i.name === trimmed)
  const filtered =
    trimmed === ''
      ? repeatItems
      : repeatItems.filter((i) =>
          i.name.toLowerCase().includes(trimmed.toLowerCase()),
        )
  const groups = groupByStore(filtered, stores)

  const handleCreate = () => {
    addRepeatItem(trimmed)
    setSearch('')
  }

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleTap = (item: Item) => {
    if (editing) {
      setItemToEdit(item)
      setEditName(item.name)
    } else if (item.shelved) {
      toggleSelected(item.id)
    } else {
      shelveItem(item.id)
      toast(`「${item.name}」をリストから外しました`)
    }
  }

  // 画面に並んでいる順(お店ごと・名前順)のままリストの末尾に並べる
  const handleRegister = () => {
    const ids = groupByStore(selectedItems, stores).flatMap((g) =>
      g.items.map((i) => i.id),
    )
    unshelveItems(ids)
    setSelectedIds(new Set())
    toast.success(`${ids.length}件を買い物リストに登録しました`)
  }

  const toggleEditing = () => {
    setEditing((prev) => !prev)
    setSelectedIds(new Set())
  }

  const handleRename = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!itemToEdit) return
    const name = editName.trim()
    if (!name) return
    if (name !== itemToEdit.name) updateItemName(itemToEdit.id, name)
    setItemToEdit(null)
  }

  if (loading) return <ListBodySkeleton />

  return (
    <div className={selectedItems.length > 0 ? 'pb-14' : undefined}>
      <div className="grid gap-4">
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
        {repeatItems.length === 0 ? (
          <p className="py-6 text-xs text-muted-foreground">
            ここに登録したものは、買ったあともここに戻ります
          </p>
        ) : groups.length === 0 ? (
          <p className="py-6 text-xs">リピ買いが見つかりません</p>
        ) : (
          groups.map((group) => (
            <section key={group.store?.id ?? 'none'} className="grid gap-2">
              <h2 className="px-1 text-xs text-muted-foreground">
                {group.store?.name ?? 'お店未選択'}
              </h2>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <RepeatItemButton
                    key={item.id}
                    item={item}
                    editing={editing}
                    selected={selectedIds.has(item.id)}
                    onClick={() => handleTap(item)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
        {repeatItems.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto w-fit"
            onClick={toggleEditing}
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

      {selectedItems.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+0.5rem)] z-10 flex justify-center px-4">
          <Button size="lg" onClick={handleRegister}>
            <span className="text-trim">
              買い物リストに登録({selectedItems.length}件)
            </span>
          </Button>
        </div>
      )}

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
                <DrawerTitle>"{itemToDelete?.name}"を削除しますか?</DrawerTitle>
                <DrawerDescription>
                  リピ買いから消えます。リストに出ている場合は、リストからも消えます。
                </DrawerDescription>
              </DrawerHeader>
              <div className="mx-auto flex w-64 flex-col gap-2 px-4">
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => {
                    if (itemToDelete) deleteItem(itemToDelete.id)
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
    </div>
  )
}

/**
 * リピ買いの品のボタン。状態ごとにタップの意味が違うので、見た目で区別する。
 * しまわれている品は枠線、選んだ品は登録ボタンと同じ青、リストに出ている品はグレーに ✓。
 * 編集モードでは状態によらず鉛筆を付ける。
 */
function RepeatItemButton({
  item,
  editing,
  selected,
  onClick,
}: {
  item: Item
  editing: boolean
  selected: boolean
  onClick: () => void
}) {
  if (editing) {
    return (
      <Button variant="outline" size="sm" onClick={onClick}>
        <Pencil data-icon="inline-start" />
        <span className="text-trim">{item.name}</span>
      </Button>
    )
  }
  if (!item.shelved) {
    return (
      <Button
        variant="secondary"
        size="sm"
        className="text-muted-foreground"
        onClick={onClick}
      >
        <CircleCheck data-icon="inline-start" />
        <span className="text-trim">{item.name}</span>
        <span className="sr-only">(リストにあり。タップでリストから外す)</span>
      </Button>
    )
  }
  return (
    <Button
      variant={selected ? 'default' : 'outline'}
      size="sm"
      aria-pressed={selected}
      onClick={onClick}
    >
      {selected && <Check data-icon="inline-start" />}
      <span className="text-trim">{item.name}</span>
    </Button>
  )
}
