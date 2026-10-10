import { useRef, useState } from 'react'
import { Ellipsis, Repeat, Trash2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { StoreSelector } from '@/components/StoreSelector'
import type { Item, Store } from '@/lib/types'

type Props = {
  item: Item
  stores: Store[]
  onSetStore: (storeId: string | null) => void
  onSetRepeat: (repeat: boolean) => void
  onDelete: () => void
  onShelve: () => void
  onAddStore: (name: string) => string
  onRenameStore: (storeId: string, name: string) => void
  onDeleteStore: (storeId: string) => void
}

/**
 * アイテム行の右端の「…」から開く設定ドロワー。リピ買いの切り替え、お店の選択、行の取り除きをまとめて置く。
 *
 * 一番下のボタンは、普通のアイテムなら「削除」、リピ買いなら「リピ買いに戻す」。
 * どちらも行がリストから消えてこのドロワーごとアンマウントされるので、
 * 閉じるアニメーションの途中で消えないよう、ドロワーが閉じ切ってから実行する。
 *
 * 下端の余白はボトムメニューと同じ高さ(4rem + ホームインジケーター分。後者は index.css でドロワーに足している)にする。
 */
export function ItemSettingsDrawer({
  item,
  stores,
  onSetStore,
  onSetRepeat,
  onDelete,
  onShelve,
  onAddStore,
  onRenameStore,
  onDeleteStore,
}: Props) {
  const [open, setOpen] = useState(false)
  const afterCloseRef = useRef<(() => void) | null>(null)
  const store = item.store_id
    ? (stores.find((s) => s.id === item.store_id) ?? null)
    : null

  const closeThen = (action: () => void) => {
    afterCloseRef.current = action
    setOpen(false)
  }

  const handleOpenChangeComplete = (next: boolean) => {
    if (next) return
    const action = afterCloseRef.current
    afterCloseRef.current = null
    action?.()
  }

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={handleOpenChangeComplete}
      showSwipeHandle={true}
    >
      <DrawerTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 text-muted-foreground"
            aria-label={`${item.name}のメニュー`}
          />
        }
      >
        <Ellipsis />
      </DrawerTrigger>
      <DrawerContent initialFocus={false}>
        <DrawerHeader>
          <DrawerTitle className="truncate">{item.name}</DrawerTitle>
        </DrawerHeader>
        <div className="grid gap-4 overflow-y-auto px-4 pb-16">
          <div className="flex items-center justify-between gap-4 p-1">
            <Label htmlFor={`repeat-${item.id}`} className="text-sm font-bold">
              <Repeat className="size-4" />
              リピ買い
            </Label>
            <Switch
              id={`repeat-${item.id}`}
              checked={item.repeat}
              onCheckedChange={(checked) => onSetRepeat(checked)}
            />
          </div>
          <Separator />
          <div className="grid gap-2">
            <p className="px-1 text-sm font-bold">お店</p>
            <StoreSelector
              stores={stores}
              selected={store}
              onSelect={(storeId) => {
                onSetStore(storeId)
                setOpen(false)
              }}
              onAddStore={onAddStore}
              onRenameStore={onRenameStore}
              onDeleteStore={onDeleteStore}
            />
          </div>
          <Separator />
          {item.repeat ? (
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => closeThen(onShelve)}
            >
              <Undo2 data-icon="inline-start" />
              <span className="text-trim">リピ買いに戻す</span>
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              className="w-fit"
              onClick={() => closeThen(onDelete)}
            >
              <Trash2 data-icon="inline-start" />
              <span className="text-trim">削除</span>
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
