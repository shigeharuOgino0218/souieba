import { useCallback, useEffect, useRef, useState } from 'react'
import { CirclePlus } from 'lucide-react'
import { useActiveListData } from '@/hooks/useLists'
import { Button } from '@/components/ui/button'
import { ItemRow } from '@/components/ItemRow'
import { ListBodySkeleton } from '@/components/ListHeader'
import { SweepBanner } from '@/components/SweepBanner'
import { pickSweepNotice } from '@/lib/repeat'

// 片付けの予告と「追加」ボタンのあいだ、予告とボトムメニューのあいだの隙間 (0.5rem)
const GAP_PX = 8

/**
 * 選択中のリストのアイテムを編集する本体。
 *
 * 「追加」ボタンはリストの末尾に置き、sticky で画面下に張り付かせる。リストが短いあいだは最後の行の直下、
 * 長くなるとボトムメニューの上で止まる。片付けの予告はボトムメニューの上に固定するので、
 * 予告が出ているあいだは、その高さを測って「追加」ボタンの止まる位置を予告の上に持ち上げる。
 */
export function ListEditor() {
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
    deleteItem,
    addStore,
    renameStore,
    deleteStore,
  } = useActiveListData()

  // リピ買いにしまわれているアイテムも同じ items に入っているので、リストに出す分を分ける
  const listItems = items.filter((i) => !i.shelved)
  const sweepNotice = pickSweepNotice(listItems)

  const [bannerHeight, setBannerHeight] = useState(0)
  const bannerRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    const observer = new ResizeObserver(([entry]) =>
      setBannerHeight(entry.borderBoxSize[0].blockSize),
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      setBannerHeight(0)
    }
  }, [])
  const bannerSpace = bannerHeight > 0 ? bannerHeight + GAP_PX : 0

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

  if (loading) return <ListBodySkeleton />

  return (
    <div>
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
      <div
        className="sticky z-10 mt-2 w-fit"
        style={{
          bottom: `calc(var(--bottom-nav-height) + ${GAP_PX + bannerSpace}px)`,
        }}
      >
        <Button size="lg" onClick={handleAdd}>
          <CirclePlus data-icon="inline-start" />
          <span className="text-trim">追加</span>
        </Button>
      </div>
      {/* 末尾までスクロールしたときも、「追加」ボタンが予告の裏に入らないだけの余白 */}
      <div style={{ height: bannerSpace }} />
      {sweepNotice && (
        <div
          ref={bannerRef}
          className="fixed inset-x-0 z-10 mx-auto max-w-2xl px-4"
          style={{ bottom: `calc(var(--bottom-nav-height) + ${GAP_PX}px)` }}
        >
          <SweepBanner notice={sweepNotice} />
        </div>
      )}
    </div>
  )
}
