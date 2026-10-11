import { describe, expect, it } from 'vitest'
import {
  addDays,
  formatMealDate,
  mealDays,
  msUntilTokyoMidnight,
  tokyoToday,
} from '@/lib/meals'

describe('tokyoToday', () => {
  it('UTC では前日でも、日本時間で日付が変わっていれば翌日', () => {
    expect(tokyoToday(new Date('2026-10-10T15:00:00Z'))).toBe('2026-10-11')
  })

  it('日本時間の 23:59 はまだその日', () => {
    expect(tokyoToday(new Date('2026-10-11T14:59:59Z'))).toBe('2026-10-11')
  })
})

describe('addDays', () => {
  it('月末と年末をまたぐ', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28')
  })
})

describe('formatMealDate', () => {
  it('月/日と曜日を出す', () => {
    expect(formatMealDate('2026-10-11')).toBe('10/11 (日)')
    expect(formatMealDate('2026-10-12')).toBe('10/12 (月)')
  })
})

describe('mealDays', () => {
  it('昨日から8日分を並べ、2日目を今日にする', () => {
    const days = mealDays('2026-10-11')
    expect(days.map((d) => d.date)).toEqual([
      '2026-10-10',
      '2026-10-11',
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
    ])
    expect(days.map((d) => d.relation)).toEqual([
      'yesterday',
      'today',
      'future',
      'future',
      'future',
      'future',
      'future',
      'future',
    ])
    expect(days[0].label).toBe('10/10 (土)')
  })
})

describe('msUntilTokyoMidnight', () => {
  it('日本時間の 23:00 なら1時間', () => {
    expect(msUntilTokyoMidnight(new Date('2026-10-11T14:00:00Z'))).toBe(
      60 * 60 * 1000,
    )
  })

  it('日本時間の 0:00 ちょうどなら丸1日', () => {
    expect(msUntilTokyoMidnight(new Date('2026-10-10T15:00:00Z'))).toBe(
      24 * 60 * 60 * 1000,
    )
  })
})
