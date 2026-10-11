import { describe, expect, it } from 'vitest'
import { splitPastedLines } from '@/lib/paste'

describe('splitPastedLines', () => {
  it('改行ごとに分ける', () => {
    expect(splitPastedLines('牛乳\n卵\r\nパン\rバター')).toEqual([
      '牛乳',
      '卵',
      'パン',
      'バター',
    ])
  })

  it('改行が無ければ1行のまま', () => {
    expect(splitPastedLines('牛乳 2本')).toEqual(['牛乳 2本'])
  })

  it('前後の空白を削り、空行は捨てる', () => {
    expect(splitPastedLines('\n  牛乳  \n\n \n卵\n')).toEqual(['牛乳', '卵'])
  })

  it('行中のタブはスペースにする', () => {
    expect(splitPastedLines('牛乳\t2本\n卵')).toEqual(['牛乳 2本', '卵'])
  })

  it('行頭の箇条書き記号を取り除く', () => {
    expect(
      splitPastedLines('・牛乳\n- 卵\n* パン\n• バター\n● 米\n□ 塩\n☐ 砂糖'),
    ).toEqual(['牛乳', '卵', 'パン', 'バター', '米', '塩', '砂糖'])
  })

  it('チェックボックスの記号を取り除く', () => {
    expect(splitPastedLines('- [ ] 牛乳\n- [x] 卵\n[X] パン')).toEqual([
      '牛乳',
      '卵',
      'パン',
    ])
  })

  it('行頭の番号を取り除く', () => {
    expect(splitPastedLines('1. 牛乳\n2) 卵\n10.パン')).toEqual([
      '牛乳',
      '卵',
      'パン',
    ])
  })

  it('数字で始まる名前は削らない', () => {
    expect(splitPastedLines('1.5L 水\n2L お茶\n3個パック')).toEqual([
      '1.5L 水',
      '2L お茶',
      '3個パック',
    ])
  })

  it('記号だけの行は捨てる', () => {
    expect(splitPastedLines('牛乳\n-\n・\n卵')).toEqual(['牛乳', '卵'])
  })
})
