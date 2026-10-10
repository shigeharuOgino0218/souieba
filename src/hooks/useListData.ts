import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { generateId } from '@/lib/id'
import type { Item, Store } from '@/lib/types'

// 自分の編集直後に届く Realtime エコーで入力中のテキストを巻き戻さないための猶予
const EDIT_ECHO_IGNORE_MS = 3000
const NAME_SAVE_DEBOUNCE_MS = 500

function sortByPosition(items: Item[]): Item[] {
  return [...items].sort((a, b) => a.position - b.position)
}

function endPosition(items: Item[]): number {
  return (sortByPosition(items).at(-1)?.position ?? 0) + 1
}

function upsertById<T extends { id: string }>(rows: T[], row: T): T[] {
  return rows.some((r) => r.id === row.id)
    ? rows.map((r) => (r.id === row.id ? row : r))
    : [...rows, row]
}

export function useListData(listId: string, userId: string) {
  const [items, setItems] = useState<Item[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  const itemsRef = useRef<Item[]>([])
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const recentEdits = useRef(new Map<string, number>())
  const nameTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const [itemsRes, storesRes] = await Promise.all([
        supabase
          .from('items')
          .select('*')
          .eq('list_id', listId)
          .order('position'),
        supabase
          .from('stores')
          .select('*')
          .eq('list_id', listId)
          .order('created_at'),
      ])
      if (cancelled) return
      if (itemsRes.error || storesRes.error)
        toast.error('リストの読み込みに失敗しました')
      setItems(itemsRes.data ?? [])
      setStores(storesRes.data ?? [])
      setLoading(false)
    }
    void load()

    const handleItemChange = (
      payload: RealtimePostgresChangesPayload<Item>,
    ) => {
      if (payload.eventType === 'INSERT') {
        setItems((prev) => sortByPosition(upsertById(prev, payload.new)))
      } else if (payload.eventType === 'UPDATE') {
        const editedAt = recentEdits.current.get(payload.new.id)
        if (editedAt && Date.now() - editedAt < EDIT_ECHO_IGNORE_MS) return
        setItems((prev) => sortByPosition(upsertById(prev, payload.new)))
      } else {
        const oldId = (payload.old as Partial<Item>).id
        if (oldId) setItems((prev) => prev.filter((i) => i.id !== oldId))
      }
    }

    const handleStoreChange = (
      payload: RealtimePostgresChangesPayload<Store>,
    ) => {
      if (payload.eventType === 'DELETE') {
        const oldId = (payload.old as Partial<Store>).id
        if (oldId) setStores((prev) => prev.filter((s) => s.id !== oldId))
      } else {
        setStores((prev) => upsertById(prev, payload.new))
      }
    }

    const channel = supabase
      .channel(`list-${listId}`)
      .on<Item>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
          filter: `list_id=eq.${listId}`,
        },
        handleItemChange,
      )
      .on<Store>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stores',
          filter: `list_id=eq.${listId}`,
        },
        handleStoreChange,
      )
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [listId])

  // 追加した行に即フォーカスできるよう、id をクライアント側で発行して同期的に返す
  const addItem = useCallback(
    (afterId?: string): string => {
      const id = generateId()
      const sorted = sortByPosition(itemsRef.current)
      let position: number
      if (afterId) {
        const idx = sorted.findIndex((i) => i.id === afterId)
        const cur = sorted[idx]
        const next = sorted[idx + 1]
        position = next
          ? (cur.position + next.position) / 2
          : (cur?.position ?? 0) + 1
      } else {
        position = endPosition(sorted)
      }
      const newItem: Item = {
        id,
        list_id: listId,
        name: '',
        checked: false,
        store_id: null,
        position,
        created_by: userId,
        created_at: new Date().toISOString(),
        repeat: false,
        shelved: false,
      }
      setItems((prev) => sortByPosition([...prev, newItem]))
      supabase
        .from('items')
        .insert({ id, list_id: listId, position, created_by: userId })
        .then(({ error }) => {
          if (error) {
            toast.error('アイテムの追加に失敗しました')
            setItems((prev) => prev.filter((i) => i.id !== id))
          }
        })
      return id
    },
    [listId, userId],
  )

  // リピ買いはドロワーにも名前を出すので空の名前を保存しない。空のまま入力を終えたら ItemRow が元の名前に戻す
  const updateItemName = useCallback((id: string, name: string) => {
    recentEdits.current.set(id, Date.now())
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, name } : i)))
    const timers = nameTimers.current
    clearTimeout(timers.get(id))
    timers.set(
      id,
      setTimeout(() => {
        timers.delete(id)
        const repeat = itemsRef.current.find((i) => i.id === id)?.repeat
        if (repeat && name.trim() === '') return
        recentEdits.current.set(id, Date.now())
        supabase
          .from('items')
          .update({ name })
          .eq('id', id)
          .then(({ error }) => {
            if (error) toast.error('保存に失敗しました')
          })
      }, NAME_SAVE_DEBOUNCE_MS),
    )
  }, [])

  const patchItem = useCallback((id: string, patch: Partial<Item>) => {
    setItems((prev) =>
      sortByPosition(prev.map((i) => (i.id === id ? { ...i, ...patch } : i))),
    )
    supabase
      .from('items')
      .update(patch)
      .eq('id', id)
      .then(({ error }) => {
        if (error) toast.error('更新に失敗しました')
      })
  }, [])

  const toggleChecked = useCallback(
    (id: string, checked: boolean) => patchItem(id, { checked }),
    [patchItem],
  )

  const setItemStore = useCallback(
    (id: string, storeId: string | null) =>
      patchItem(id, { store_id: storeId }),
    [patchItem],
  )

  const setRepeat = useCallback(
    (id: string, repeat: boolean) => patchItem(id, { repeat }),
    [patchItem],
  )

  // リストからリピ買いのドロワーに戻す。買っていないのでチェックも外す
  const shelveItem = useCallback(
    (id: string) => patchItem(id, { shelved: true, checked: false }),
    [patchItem],
  )

  // リピ買いのドロワーからリストの末尾に戻す。DB トリガーが「追加」として通知する
  const unshelveItem = useCallback(
    (id: string) =>
      patchItem(id, {
        shelved: false,
        position: endPosition(itemsRef.current),
      }),
    [patchItem],
  )

  // リピ買いのドロワーに直接登録する。リストには出さないので通知もされない
  const addRepeatItem = useCallback(
    (name: string) => {
      const id = generateId()
      const position = endPosition(itemsRef.current)
      const newItem: Item = {
        id,
        list_id: listId,
        name,
        checked: false,
        store_id: null,
        position,
        created_by: userId,
        created_at: new Date().toISOString(),
        repeat: true,
        shelved: true,
      }
      setItems((prev) => sortByPosition([...prev, newItem]))
      supabase
        .from('items')
        .insert({
          id,
          list_id: listId,
          name,
          position,
          created_by: userId,
          repeat: true,
          shelved: true,
        })
        .then(({ error }) => {
          if (error) {
            toast.error('リピ買いの登録に失敗しました')
            setItems((prev) => prev.filter((i) => i.id !== id))
          }
        })
    },
    [listId, userId],
  )

  const deleteItem = useCallback((id: string) => {
    clearTimeout(nameTimers.current.get(id))
    nameTimers.current.delete(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
    supabase
      .from('items')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) toast.error('削除に失敗しました')
      })
  }, [])

  const addStore = useCallback(
    (name: string): string => {
      const id = generateId()
      const newStore: Store = {
        id,
        list_id: listId,
        name,
        created_at: new Date().toISOString(),
      }
      setStores((prev) => [...prev, newStore])
      supabase
        .from('stores')
        .insert({ id, list_id: listId, name })
        .then(({ error }) => {
          if (error) {
            toast.error('お店の追加に失敗しました')
            setStores((prev) => prev.filter((s) => s.id !== id))
          }
        })
      return id
    },
    [listId],
  )

  const renameStore = useCallback((id: string, name: string) => {
    setStores((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)))
    supabase
      .from('stores')
      .update({ name })
      .eq('id', id)
      .then(({ error }) => {
        if (error) toast.error('お店の名前の変更に失敗しました')
      })
  }, [])

  const deleteStore = useCallback((id: string) => {
    setStores((prev) => prev.filter((s) => s.id !== id))
    setItems((prev) =>
      prev.map((i) => (i.store_id === id ? { ...i, store_id: null } : i)),
    )
    supabase
      .from('stores')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) toast.error('お店の削除に失敗しました')
      })
  }, [])

  return {
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
  }
}
