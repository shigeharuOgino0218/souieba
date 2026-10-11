import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { ListBodySkeleton } from '@/components/ListHeader'
import { useMeals } from '@/hooks/useMeals'
import {
  MEAL_SLOTS,
  mealDays,
  mealKey,
  msUntilTokyoMidnight,
  tokyoToday,
} from '@/lib/meals'
import { cn } from '@/lib/utils'

/**
 * 表示する8日分。開いたまま日本時間の日付が変わったら1日進める。
 * スリープ中はタイマーが止まって遅れるので、画面に戻ったときにも日付を確かめ直す。
 */
function useMealDays() {
  const [today, setToday] = useState(() => tokyoToday(new Date()))

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      timer = setTimeout(sync, msUntilTokyoMidnight(new Date()))
    }
    const sync = () => {
      clearTimeout(timer)
      setToday(tokyoToday(new Date()))
      schedule()
    }
    schedule()
    document.addEventListener('visibilitychange', sync)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  return useMemo(() => mealDays(today), [today])
}

/** 献立の1コマの入力欄。改行でき、内容に合わせて高さが伸びる。field-sizing に頼れないブラウザがあるので scrollHeight で合わせる */
function MealInput({
  value,
  label,
  onChange,
}: {
  value: string
  label: string
  onChange: (value: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder="未定"
      aria-label={label}
      className="block w-full resize-none overflow-hidden bg-transparent text-base leading-6 outline-none placeholder:text-muted-foreground/60"
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

/**
 * 献立のタブの本文。昨日から6日後までの8日を縦に並べ、各日に朝・昼・夜の3行を置く。
 * 今日は見出しを primary 色にしてバッジを付ける。昨日は全体を薄くし、読むだけにする。
 */
export function MealPlan({ listId }: { listId: string }) {
  const days = useMealDays()
  const { meals, loading, setMealBody } = useMeals(listId, days[0].date)

  if (loading) return <ListBodySkeleton />

  return (
    <div className="divide-y">
      {days.map((day) => {
        const readOnly = day.relation === 'yesterday'
        return (
          <section
            key={day.date}
            className={cn('py-3', readOnly && 'opacity-60')}
          >
            <h2
              className={cn(
                'flex items-center gap-2 text-sm font-bold',
                day.relation === 'today' && 'text-primary',
              )}
            >
              {day.label}
              {day.relation === 'today' && <Badge>今日</Badge>}
            </h2>
            <div className="mt-1">
              {MEAL_SLOTS.map(({ slot, label }) => {
                const body = meals.get(mealKey(day.date, slot))?.body ?? ''
                return (
                  <div
                    key={slot}
                    className="grid grid-cols-[2rem_1fr] items-start py-1"
                  >
                    <span className="text-sm leading-6 text-muted-foreground">
                      {label}
                    </span>
                    {readOnly ? (
                      <p className="text-base leading-6 break-words whitespace-pre-wrap">
                        {body.trim() || '—'}
                      </p>
                    ) : (
                      <MealInput
                        value={body}
                        label={`${day.label}の${label}`}
                        onChange={(value) => setMealBody(day.date, slot, value)}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
