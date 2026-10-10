import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { CirclePlus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useListData } from '@/hooks/useListData'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ItemRow } from '@/components/ItemRow'
import { RepeatBuyDrawer } from '@/components/RepeatBuyDrawer'
import { SweepBanner } from '@/components/SweepBanner'
import { pickSweepNotice } from '@/lib/repeat'

export const LAST_LIST_KEY = 'souieba:lastListId'

export function ListEditor({
  listId,
  action,
}: {
  listId: string
  action?: ReactNode
}) {
  const { session } = useAuth()
  const {
    items,
    stores,
    loading,
    addItem,
    updateItemName,
    toggleChecked,
    setItemStore,
    setRepeat,
    shelveItem,
    unshelveItem,
    addRepeatItem,
    deleteItem,
    addStore,
    renameStore,
    deleteStore,
  } = useListData(listId, session!.user.id)

  // リピ買いのドロワーにしまわれているアイテムも同じ items に入っているので、リストに出す分を分ける
  const listItems = items.filter((i) => !i.shelved)
  const repeatItems = items.filter((i) => i.repeat)
  const sweepNotice = pickSweepNotice(listItems)

  useEffect(() => {
    localStorage.setItem(LAST_LIST_KEY, listId)
  }, [listId])

  const inputRefs = useRef(new Map<string, HTMLInputElement>())
  const registerInput = useCallback(
    (id: string, el: HTMLInputElement | null) => {
      if (el) inputRefs.current.set(id, el)
      else inputRefs.current.delete(id)
    },
    [],
  )

  const [focusId, setFocusId] = useState<string | null>(null)
  useEffect(() => {
    if (!focusId) return
    const el = inputRefs.current.get(focusId)
    if (el) {
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
      setFocusId(null)
    }
  }, [focusId, items])

  const handleEnter = (id: string) => setFocusId(addItem(id))
  const handleAdd = () => setFocusId(addItem())

  const handleBackspaceEmpty = (id: string) => {
    const idx = listItems.findIndex((i) => i.id === id)
    const prev = listItems[idx - 1]
    deleteItem(id)
    if (prev) setFocusId(prev.id)
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  return (
    <div>
      {/* 片付けの予告が下のバーの上に重なる分だけ、最後の行が隠れないよう余白を広げる */}
      <div className={sweepNotice ? 'mb-52' : 'mb-36'}>
        {listItems.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            stores={stores}
            onNameChange={updateItemName}
            onToggle={toggleChecked}
            onEnter={handleEnter}
            onBackspaceEmpty={handleBackspaceEmpty}
            onSetStore={setItemStore}
            onSetRepeat={setRepeat}
            onDelete={deleteItem}
            onShelve={shelveItem}
            onAddStore={addStore}
            onRenameStore={renameStore}
            onDeleteStore={deleteStore}
            registerInput={registerInput}
          />
        ))}
      </div>
      {/* <Separator /> */}
      <div className="fixed bottom-[max(0.5rem,calc(env(safe-area-inset-bottom)))] z-10 grid w-[calc(100%-2rem)] gap-1">
        {sweepNotice && <SweepBanner notice={sweepNotice} />}
        <div className="flex translate-y-1/8 items-center justify-between rounded-full bg-muted/50 p-2 backdrop-blur">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={handleAdd}
              className="!bg-background dark:!bg-muted"
            >
              <CirclePlus data-icon="inline-start" />
              <span className="text-trim">追加</span>
            </Button>
            <RepeatBuyDrawer
              items={repeatItems}
              stores={stores}
              onRestore={unshelveItem}
              onShelve={shelveItem}
              onAdd={addRepeatItem}
              onRename={updateItemName}
              onDelete={deleteItem}
            />
          </div>
          {action}
        </div>
      </div>
    </div>
  )
}
