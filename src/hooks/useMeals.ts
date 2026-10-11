import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { mealKey, type MealSlot } from '@/lib/meals'
import type { Meal } from '@/lib/types'

// 自分の編集直後に届く Realtime エコーで入力中のテキストを巻き戻さないための猶予
const EDIT_ECHO_IGNORE_MS = 3000
const BODY_SAVE_DEBOUNCE_MS = 500

/**
 * リストの献立を from 以降の日付についてすべて読み込み、Realtime で同期する。
 * 先の日付に上限を付けないので、開いたまま日付が変わって表示が1日進んでも読み直さずに済む。
 * from は読み込むときの下限にしか使わないため、変わっても購読を張り直さない。
 *
 * 書き込みは買い物リストの名前と同じく、手元にすぐ反映してから debounce して送る。
 * コマごとに upsert し、中身が空白だけになったら行を削除する。
 */
export function useMeals(listId: string, from: string) {
  const [meals, setMeals] = useState<Map<string, Meal>>(new Map())
  // 読み込み済みのリスト。切り替えた直後は前のリストの中身が残っているので、一致するまで読み込み中として扱う
  const [loadedListId, setLoadedListId] = useState<string | null>(null)
  const loading = loadedListId !== listId

  const fromRef = useRef(from)
  useEffect(() => {
    fromRef.current = from
  }, [from])

  const recentEdits = useRef(new Map<string, number>())
  const saveTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('list_id', listId)
        .gte('date', fromRef.current)
      if (cancelled) return
      if (error) toast.error('献立の読み込みに失敗しました')
      setMeals(new Map((data ?? []).map((m) => [mealKey(m.date, m.slot), m])))
      setLoadedListId(listId)
    }
    void load()

    const handleChange = (payload: RealtimePostgresChangesPayload<Meal>) => {
      const row = payload.eventType === 'DELETE' ? payload.old : payload.new
      if (!row.date || !row.slot) return
      const key = mealKey(row.date, row.slot)
      const editedAt = recentEdits.current.get(key)
      if (editedAt && Date.now() - editedAt < EDIT_ECHO_IGNORE_MS) return
      setMeals((prev) => {
        const next = new Map(prev)
        if (payload.eventType === 'DELETE') next.delete(key)
        else next.set(key, payload.new)
        return next
      })
    }

    const channel = supabase
      .channel(`meals-${listId}`)
      .on<Meal>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meals',
          filter: `list_id=eq.${listId}`,
        },
        handleChange,
      )
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [listId])

  const setMealBody = useCallback(
    (date: string, slot: MealSlot, body: string) => {
      const key = mealKey(date, slot)
      recentEdits.current.set(key, Date.now())
      setMeals((prev) =>
        new Map(prev).set(key, { list_id: listId, date, slot, body }),
      )
      const timers = saveTimers.current
      clearTimeout(timers.get(key))
      timers.set(
        key,
        setTimeout(() => {
          timers.delete(key)
          recentEdits.current.set(key, Date.now())
          const onSaved = ({ error }: { error: unknown }) => {
            if (error) toast.error('献立の保存に失敗しました')
          }
          if (body.trim() === '') {
            supabase
              .from('meals')
              .delete()
              .match({ list_id: listId, date, slot })
              .then(onSaved)
          } else {
            supabase
              .from('meals')
              .upsert({ list_id: listId, date, slot, body })
              .then(onSaved)
          }
        }, BODY_SAVE_DEBOUNCE_MS),
      )
    },
    [listId],
  )

  return { meals, loading, setMealBody }
}
