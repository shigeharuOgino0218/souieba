import { useState, type MouseEvent, type SubmitEvent } from 'react'
import { Pencil, Trash2, CircleMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import type { Store } from '@/lib/types'

type Props = {
  stores: Store[]
  selected: Store | null
  onSelect: (storeId: string | null) => void
  onAddStore: (name: string) => string
  onRenameStore: (storeId: string, name: string) => void
  onDeleteStore: (storeId: string) => void
}

/**
 * アイテムのお店を選ぶ欄。検索欄に無い名前を入れると、その場でお店を追加して選ぶ。
 * お店の名前の変更と削除は、この上に重ねたドロワーで行う。
 * アイテムの設定ドロワーの中に置き、選んだあとにドロワーを閉じるかは呼び出し元が決める。
 */
export function StoreSelector({
  stores,
  selected,
  onSelect,
  onAddStore,
  onRenameStore,
  onDeleteStore,
}: Props) {
  const [search, setSearch] = useState('')
  const [storeToEdit, setStoreToEdit] = useState<Store | null>(null)
  const [editName, setEditName] = useState('')
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null)

  const trimmed = search.trim()
  const canCreate = trimmed !== '' && !stores.some((s) => s.name === trimmed)
  const filtered =
    trimmed === ''
      ? stores
      : stores.filter((s) =>
          s.name.toLowerCase().includes(trimmed.toLowerCase()),
        )

  const handleCreate = () => onSelect(onAddStore(trimmed))

  const handleRename = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!storeToEdit) return
    const name = editName.trim()
    if (!name) return
    if (name !== storeToEdit.name) onRenameStore(storeToEdit.id, name)
    setStoreToEdit(null)
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2 p-1">
        <Input
          placeholder="お店を追加 or 検索"
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
      {filtered.length === 0 ? (
        <p className="py-6 text-xs">お店が見つかりません</p>
      ) : (
        <RadioGroup
          value={selected?.id ?? ''}
          onValueChange={(value) => onSelect(value as string)}
          className="grid grid-cols-2 gap-2"
        >
          {filtered.map((store) => (
            <div
              key={store.id}
              className="grid grid-cols-[1fr_auto] items-center rounded-full bg-muted p-1 ring-2 ring-transparent has-data-checked:ring-primary"
            >
              <div className="flex items-center gap-2 px-2.5">
                <RadioGroupItem
                  value={store.id}
                  id={store.id}
                  className="hidden"
                />
                <Label htmlFor={store.id} className="flex-1 text-xs">
                  {store.name}
                </Label>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${store.name}を編集`}
                onClick={(e: MouseEvent) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setStoreToEdit(store)
                  setEditName(store.name)
                }}
              >
                <Pencil className="size-3.5" />
              </Button>
            </div>
          ))}
        </RadioGroup>
      )}
      {selected && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelect(null)}
          className="w-fit"
        >
          <CircleMinus data-icon="inline-start" />
          <span className="text-trim">
            選択中のお店を解除（{selected.name}）
          </span>
        </Button>
      )}
      <Drawer
        open={!!storeToEdit}
        onOpenChange={(next) => {
          if (!next) setStoreToEdit(null)
        }}
        showSwipeHandle={true}
      >
        <DrawerContent initialFocus={false}>
          <DrawerHeader>
            <DrawerTitle>"{storeToEdit?.name}"を編集</DrawerTitle>
          </DrawerHeader>
          <form
            onSubmit={handleRename}
            className="grid gap-5 overflow-y-auto px-4"
          >
            <div className="flex items-center gap-2">
              <Input
                placeholder="お店の名前"
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
              onClick={() => setStoreToDelete(storeToEdit)}
            >
              <Trash2 data-icon="inline-start" />
              <span className="text-trim">削除</span>
            </Button>
          </form>

          <Drawer
            open={!!storeToDelete}
            onOpenChange={(next) => {
              if (!next) setStoreToDelete(null)
            }}
            showSwipeHandle={true}
          >
            <DrawerContent initialFocus={false}>
              <DrawerHeader>
                <DrawerTitle>
                  "{storeToDelete?.name}"を削除しますか?
                </DrawerTitle>
                <DrawerDescription>
                  このお店を選択しているアイテムからも外れます。
                </DrawerDescription>
              </DrawerHeader>
              <div className="mx-auto flex w-64 flex-col gap-2 px-4">
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => {
                    if (storeToDelete) onDeleteStore(storeToDelete.id)
                    setStoreToDelete(null)
                    setStoreToEdit(null)
                  }}
                >
                  削除
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setStoreToDelete(null)}
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
