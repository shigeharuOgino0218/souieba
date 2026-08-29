import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateId } from '@/lib/id'

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('generateId', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('v4 UUID を返す', () => {
    expect(generateId()).toMatch(UUID_V4)
  })

  it('randomUUID が無い環境でも v4 UUID を返す', () => {
    const realCrypto = globalThis.crypto
    vi.stubGlobal('crypto', {
      getRandomValues: (array: Uint8Array<ArrayBuffer>) =>
        realCrypto.getRandomValues(array),
    })

    const ids = Array.from({ length: 32 }, () => generateId())
    for (const id of ids) expect(id).toMatch(UUID_V4)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
