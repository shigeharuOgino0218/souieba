import { describe, expect, it } from 'vitest'
import { groupByStore, pickSweepNotice } from '@/lib/repeat'

describe('pickSweepNotice', () => {
  const item = (checked: boolean, repeat: boolean) => ({ checked, repeat })

  it('チェック済みが無ければ予告しない', () => {
    expect(pickSweepNotice([])).toBeNull()
    expect(pickSweepNotice([item(false, false), item(false, true)])).toBeNull()
  })

  it('チェック済みが普通のアイテムだけなら削除の予告', () => {
    expect(pickSweepNotice([item(true, false), item(false, true)])).toBe(
      'delete',
    )
  })

  it('チェック済みがリピ買いだけならリピ買いに戻る予告', () => {
    expect(pickSweepNotice([item(true, true), item(false, false)])).toBe(
      'return',
    )
  })

  it('両方あれば両方の予告', () => {
    expect(pickSweepNotice([item(true, false), item(true, true)])).toBe('mixed')
  })
})

describe('groupByStore', () => {
  const stores = [{ id: 's1' }, { id: 's2' }, { id: 's3' }]
  const item = (name: string, store_id: string | null) => ({ name, store_id })

  it('お店の順にまとめ、お店が未選択のものは最後に置く', () => {
    const groups = groupByStore(
      [item('電池', null), item('洗剤', 's2'), item('牛乳', 's1')],
      stores,
    )
    expect(groups.map((g) => g.store?.id ?? null)).toEqual(['s1', 's2', null])
  })

  it('アイテムの無いお店は出さない', () => {
    const groups = groupByStore([item('牛乳', 's1')], stores)
    expect(groups.map((g) => g.store?.id)).toEqual(['s1'])
  })

  it('まとまりの中は名前順', () => {
    const [group] = groupByStore(
      [item('たまご', 's1'), item('あぶらあげ', 's1'), item('かまぼこ', 's1')],
      stores,
    )
    expect(group.items.map((i) => i.name)).toEqual([
      'あぶらあげ',
      'かまぼこ',
      'たまご',
    ])
  })

  it('一覧に無いお店のアイテムは未選択として扱う', () => {
    const groups = groupByStore([item('牛乳', 'gone')], stores)
    expect(groups).toEqual([{ store: null, items: [item('牛乳', 'gone')] }])
  })
})
