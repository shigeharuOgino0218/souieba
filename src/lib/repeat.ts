/**
 * リピ買いと朝の片付けまわりの純粋関数群。
 * リピ買いのアイテムは、リストに出ているあいだもドロワーにしまわれているあいだも同じ items の行で、
 * どちらにいるかを shelved で表す。チェック済みのアイテムは毎朝 4:00 に DB 側で片付けられ、
 * 普通のアイテムは削除、リピ買いはドロワーに戻る。
 */
import type { Item, Store } from '@/lib/types'

/** 片付けの予告の種類。チェック済みが普通のアイテムだけか、リピ買いだけか、両方かで文言を変える */
export type SweepNotice = 'delete' | 'return' | 'mixed'

/** リストに出ているアイテムから、片付けの予告を選ぶ。チェック済みが無ければ予告は出さない */
export function pickSweepNotice(
  items: Pick<Item, 'checked' | 'repeat'>[],
): SweepNotice | null {
  const checked = items.filter((i) => i.checked)
  if (checked.length === 0) return null
  const repeats = checked.filter((i) => i.repeat).length
  if (repeats === 0) return 'delete'
  if (repeats === checked.length) return 'return'
  return 'mixed'
}

export type StoreGroup<T, S> = { store: S | null; items: T[] }

/**
 * リピ買いのドロワーに並べるため、アイテムをお店ごとにまとめる。
 * お店は渡された順、お店が未選択のアイテム(お店が消えた直後のものを含む)は最後に置く。
 * まとまりの中は名前順。アイテムの無いまとまりは返さない。
 */
export function groupByStore<
  T extends Pick<Item, 'name' | 'store_id'>,
  S extends Pick<Store, 'id'>,
>(items: T[], stores: S[]): StoreGroup<T, S>[] {
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, 'ja')
  const storeIds = new Set(stores.map((s) => s.id))
  const groups: StoreGroup<T, S>[] = stores.map((store) => ({
    store,
    items: items.filter((i) => i.store_id === store.id).sort(byName),
  }))
  groups.push({
    store: null,
    items: items
      .filter((i) => !i.store_id || !storeIds.has(i.store_id))
      .sort(byName),
  })
  return groups.filter((g) => g.items.length > 0)
}
