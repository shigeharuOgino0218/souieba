/**
 * 献立のページで使う日付まわりの純粋関数群。
 * 献立の日付は DB の date 型と同じ 'YYYY-MM-DD' の文字列で扱い、「今日」は端末によらず日本時間で決める。
 * 画面には昨日から6日後までの8日分を出す。昨日は読むだけで、今日以降を編集できる。
 */

export const MEAL_SLOTS = [
  { slot: 'breakfast', label: '朝' },
  { slot: 'lunch', label: '昼' },
  { slot: 'dinner', label: '夜' },
] as const

export type MealSlot = (typeof MEAL_SLOTS)[number]['slot']

export type MealDay = {
  date: string
  label: string
  relation: 'yesterday' | 'today' | 'future'
}

const MEAL_DAY_COUNT = 8
const TOKYO_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

/** 'YYYY-MM-DD' を、その日の UTC 0:00 の Date にする。曜日と日数の計算をタイムゾーンから切り離すため */
function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`)
}

/** 日本時間での今日の日付。日本時間は夏時間が無いので、UTC に9時間足した日付になる */
export function tokyoToday(now: Date): string {
  return new Date(now.getTime() + TOKYO_OFFSET_MS).toISOString().slice(0, 10)
}

/** 日付を n 日ずらす。月末や年末もまたぐ */
export function addDays(date: string, n: number): string {
  return new Date(parseDate(date).getTime() + n * DAY_MS)
    .toISOString()
    .slice(0, 10)
}

/** 見出し用の「10/12 (月)」 */
export function formatMealDate(date: string): string {
  const d = parseDate(date)
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${WEEKDAYS[d.getUTCDay()]})`
}

/** 画面に並べる8日分。today(日本時間の今日)の前日を先頭にする */
export function mealDays(today: string): MealDay[] {
  const yesterday = addDays(today, -1)
  return Array.from({ length: MEAL_DAY_COUNT }, (_, i) => {
    const date = addDays(yesterday, i)
    return {
      date,
      label: formatMealDate(date),
      relation: i === 0 ? 'yesterday' : i === 1 ? 'today' : 'future',
    }
  })
}

/** 次に日本時間の日付が変わるまでのミリ秒。開いたままの画面で日付を進めるタイマーに使う */
export function msUntilTokyoMidnight(now: Date): number {
  const nextMidnight =
    parseDate(addDays(tokyoToday(now), 1)).getTime() - TOKYO_OFFSET_MS
  return nextMidnight - now.getTime()
}

/** 献立の1コマを手元で引くためのキー */
export function mealKey(date: string, slot: string): string {
  return `${date}:${slot}`
}
