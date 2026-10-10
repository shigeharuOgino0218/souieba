import { useRef } from 'react'
import { Repeat } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { ItemSettingsDrawer } from '@/components/ItemSettingsDrawer'
import type { Item, Store } from '@/lib/types'

type Props = {
  item: Item
  stores: Store[]
  onNameChange: (id: string, name: string) => void
  onToggle: (id: string, checked: boolean) => void
  onEnter: (id: string) => void
  onBackspaceEmpty: (id: string) => void
  onSetStore: (itemId: string, storeId: string | null) => void
  onSetRepeat: (itemId: string, repeat: boolean) => void
  onDelete: (itemId: string) => void
  onShelve: (itemId: string) => void
  onAddStore: (name: string) => string
  onRenameStore: (storeId: string, name: string) => void
  onDeleteStore: (storeId: string) => void
  registerInput: (id: string, el: HTMLInputElement | null) => void
}

/**
 * 買い物リストの1行。名前はその場で編集でき、名前の下にお店とリピ買いの印を小さく出す。
 *
 * リピ買いの名前はドロワーにも出るので空にさせない。Backspace では行を消さず、
 * 空のまま入力を終えたら、編集を始めたときの名前に戻す。
 */
export function ItemRow({
  item,
  stores,
  onNameChange,
  onToggle,
  onEnter,
  onBackspaceEmpty,
  onSetStore,
  onSetRepeat,
  onDelete,
  onShelve,
  onAddStore,
  onRenameStore,
  onDeleteStore,
  registerInput,
}: Props) {
  const nameAtFocus = useRef(item.name)
  const store = item.store_id
    ? (stores.find((s) => s.id === item.store_id) ?? null)
    : null

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-start gap-x-3 overflow-hidden py-2">
      <Checkbox
        checked={item.checked}
        onCheckedChange={(checked) => onToggle(item.id, checked === true)}
        aria-label={`${item.name || 'アイテム'}を購入済みにする`}
      />
      <div className="min-w-0">
        <input
          ref={(el) => registerInput(item.id, el)}
          value={item.name}
          placeholder="アイテム名を入力"
          className={cn(
            'h-7 w-full text-base font-bold outline-none placeholder:text-muted-foreground/60',
            item.checked && 'text-muted-foreground line-through',
          )}
          onFocus={() => {
            nameAtFocus.current = item.name
          }}
          onBlur={() => {
            if (
              item.repeat &&
              item.name.trim() === '' &&
              nameAtFocus.current.trim() !== ''
            ) {
              onNameChange(item.id, nameAtFocus.current)
            }
          }}
          onChange={(e) => onNameChange(item.id, e.target.value)}
          onKeyDown={(e) => {
            // IME 変換確定の Enter で行を増やさない
            if (e.nativeEvent.isComposing) return
            if (e.key === 'Enter') {
              e.preventDefault()
              onEnter(item.id)
            } else if (
              e.key === 'Backspace' &&
              item.name === '' &&
              !item.repeat
            ) {
              e.preventDefault()
              onBackspaceEmpty(item.id)
            }
          }}
        />
        {(store || item.repeat) && (
          <p className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            {store && <span className="truncate">{store.name}</span>}
            {store && item.repeat && <span aria-hidden="true">·</span>}
            {item.repeat && (
              <span className="flex shrink-0 items-center gap-0.5">
                <Repeat className="size-3" />
                リピ買い
              </span>
            )}
          </p>
        )}
      </div>
      {item.name.trim() !== '' && (
        <ItemSettingsDrawer
          item={item}
          stores={stores}
          onSetStore={(storeId) => onSetStore(item.id, storeId)}
          onSetRepeat={(repeat) => onSetRepeat(item.id, repeat)}
          onDelete={() => onDelete(item.id)}
          onShelve={() => onShelve(item.id)}
          onAddStore={onAddStore}
          onRenameStore={onRenameStore}
          onDeleteStore={onDeleteStore}
        />
      )}
    </div>
  )
}
