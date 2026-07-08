import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { StorePicker } from '@/components/StorePicker'
import type { Item, Store } from '@/lib/types'

type Props = {
  item: Item
  stores: Store[]
  onNameChange: (id: string, name: string) => void
  onToggle: (id: string, checked: boolean) => void
  onEnter: (id: string) => void
  onBackspaceEmpty: (id: string) => void
  onSetStore: (itemId: string, storeId: string | null) => void
  onAddStore: (name: string) => string
  onRenameStore: (storeId: string, name: string) => void
  onDeleteStore: (storeId: string) => void
  registerInput: (id: string, el: HTMLInputElement | null) => void
}

export function ItemRow({
  item,
  stores,
  onNameChange,
  onToggle,
  onEnter,
  onBackspaceEmpty,
  onSetStore,
  onAddStore,
  onRenameStore,
  onDeleteStore,
  registerInput,
}: Props) {
  const store = item.store_id
    ? (stores.find((s) => s.id === item.store_id) ?? null)
    : null

  return (
    <div className="group flex items-center gap-3 py-2">
      <Checkbox
        checked={item.checked}
        onCheckedChange={(checked) => onToggle(item.id, checked === true)}
        aria-label={`${item.name || 'アイテム'}を購入済みにする`}
      />
      <input
        ref={(el) => registerInput(item.id, el)}
        value={item.name}
        placeholder="アイテム名を入力"
        className={cn(
          'flex-1 text-base font-bold outline-none placeholder:text-muted-foreground/60',
          item.checked && 'text-muted-foreground line-through',
        )}
        onChange={(e) => onNameChange(item.id, e.target.value)}
        onKeyDown={(e) => {
          // IME 変換確定の Enter で行を増やさない
          if (e.nativeEvent.isComposing) return
          if (e.key === 'Enter') {
            e.preventDefault()
            onEnter(item.id)
          } else if (e.key === 'Backspace' && item.name === '') {
            e.preventDefault()
            onBackspaceEmpty(item.id)
          }
        }}
      />
      {item.name.trim() !== '' && (
        <StorePicker
          stores={stores}
          selected={store}
          onSelect={(storeId) => onSetStore(item.id, storeId)}
          onAddStore={onAddStore}
          onRenameStore={onRenameStore}
          onDeleteStore={onDeleteStore}
        />
      )}
    </div>
  )
}
