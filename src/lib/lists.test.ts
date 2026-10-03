import { describe, expect, it } from 'vitest'
import {
  pickAfterRemoval,
  pickInitialListId,
  readRequestedListId,
} from '@/lib/lists'

describe('readRequestedListId', () => {
  it('listId が文字列なら返す', () => {
    expect(readRequestedListId({ listId: 'a' })).toBe('a')
  })

  it('state が無い・形が違うときは null', () => {
    expect(readRequestedListId(null)).toBeNull()
    expect(readRequestedListId(undefined)).toBeNull()
    expect(readRequestedListId('a')).toBeNull()
    expect(readRequestedListId({})).toBeNull()
    expect(readRequestedListId({ listId: 1 })).toBeNull()
  })
})

describe('pickInitialListId', () => {
  const ids = ['a', 'b', 'c']

  it('開きたいリストがあれば最優先する', () => {
    expect(pickInitialListId(ids, 'c', 'b')).toBe('c')
  })

  it('開きたいリストが無ければ最後に使っていたリスト', () => {
    expect(pickInitialListId(ids, 'x', 'b')).toBe('b')
    expect(pickInitialListId(ids, null, 'b')).toBe('b')
  })

  it('どちらも無ければ先頭', () => {
    expect(pickInitialListId(ids, 'x', 'y')).toBe('a')
    expect(pickInitialListId(ids, null, null)).toBe('a')
  })

  it('リストが空なら null', () => {
    expect(pickInitialListId([], 'a', 'a')).toBeNull()
  })
})

describe('pickAfterRemoval', () => {
  const ids = ['a', 'b', 'c']

  it('選択中でないリストを消したら選択は変えない', () => {
    expect(pickAfterRemoval(ids, 'a', 'b')).toBe('b')
  })

  it('選択中のリストを消したら右隣', () => {
    expect(pickAfterRemoval(ids, 'b', 'b')).toBe('c')
    expect(pickAfterRemoval(ids, 'a', 'a')).toBe('b')
  })

  it('右端なら左隣', () => {
    expect(pickAfterRemoval(ids, 'c', 'c')).toBe('b')
  })

  it('最後の 1 件を消したら null', () => {
    expect(pickAfterRemoval(['a'], 'a', 'a')).toBeNull()
  })
})
