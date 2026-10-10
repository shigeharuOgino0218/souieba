import { useRef } from 'react'
import { Repeat } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { ItemSettingsDrawer } from '@/components/ItemSettingsDrawer'
import type { Item, Store } from '@/lib/types'

// キーボードが開いて表示領域が縮み終わるのを待つ上限。これを過ぎた画面サイズの変化には追従しない
const KEYBOARD_OPEN_WAIT_MS = 1000

/**
 * フォーカスした行を、画面下の「追加」ボタンに隠れない位置までスクロールする。
 * 止まる位置は行の scroll-margin-bottom(ListEditor が --item-scroll-margin で渡す)で決まる。
 * キーボードが開いて表示領域が縮むのはフォーカスより後なので、縮んだときにもう一度合わせる。
 */
function scrollRowIntoView(row: HTMLElement) {
  const scroll = () => row.scrollIntoView({ block: 'nearest' })
  scroll()
  const viewport = window.visualViewport
  if (!viewport) return
  viewport.addEventListener('resize', scroll, { once: true })
  setTimeout(
    () => viewport.removeEventListener('resize', scroll),
    KEYBOARD_OPEN_WAIT_MS,
  )
}

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
 * リピ買いの名前はリピ買いのタブにも出るので空にさせない。Backspace では行を消さず、
 * 空のまま入力を終えたら、編集を始めたときの名前に戻す。
 * 入力欄にフォーカスしたら、タップでも Enter での移動でも、行が「追加」ボタンに隠れないようスクロールする。
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
  const rowRef = useRef<HTMLDivElement>(null)
  const store = item.store_id
    ? (stores.find((s) => s.id === item.store_id) ?? null)
    : null

  return (
    <div
      ref={rowRef}
      className="grid scroll-mb-(--item-scroll-margin) grid-cols-[auto_1fr_auto] items-center gap-x-2 overflow-hidden py-1"
    >
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
            'w-full text-base font-medium outline-none placeholder:text-muted-foreground',
            item.checked && 'text-muted-foreground line-through',
          )}
          onFocus={() => {
            nameAtFocus.current = item.name
            if (rowRef.current) scrollRowIntoView(rowRef.current)
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
            {store && (
              <span className="flex min-w-0">
                <span className="truncate">{store.name}</span>
                {item.repeat && <span aria-hidden="true">,</span>}
              </span>
            )}
            {item.repeat && (
              <span className="flex shrink-0 items-center gap-1">
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
