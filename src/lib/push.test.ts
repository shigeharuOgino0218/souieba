import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isIos,
  isPushSupported,
  matchesVapidKey,
  urlBase64ToUint8Array,
} from '@/lib/push'

describe('urlBase64ToUint8Array', () => {
  it('パディングを補って復号する', () => {
    expect(Array.from(urlBase64ToUint8Array('aGVsbG8'))).toEqual([
      104, 101, 108, 108, 111,
    ])
  })

  it('base64url の - と _ を base64 に戻す', () => {
    expect(Array.from(urlBase64ToUint8Array('-_8'))).toEqual([251, 255])
  })

  it('パディング済みの入力もそのまま扱える', () => {
    expect(Array.from(urlBase64ToUint8Array('aGk='))).toEqual([104, 105])
  })
})

describe('matchesVapidKey', () => {
  const subscriptionWith = (key: number[] | null) =>
    ({
      options: {
        applicationServerKey: key ? new Uint8Array(key).buffer : null,
      },
    }) as unknown as PushSubscription

  it('同じ鍵なら true', () => {
    expect(matchesVapidKey(subscriptionWith([251, 255]), '-_8')).toBe(true)
  })

  it('比較する鍵の末尾パディングは無視する', () => {
    expect(matchesVapidKey(subscriptionWith([251, 255]), '-_8==')).toBe(true)
  })

  it('鍵が違えば false', () => {
    expect(matchesVapidKey(subscriptionWith([251, 255]), 'AAAA')).toBe(false)
  })

  it('購読が鍵を持たなければ false', () => {
    expect(matchesVapidKey(subscriptionWith(null), '-_8')).toBe(false)
  })
})

describe('isIos', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const stubNavigator = (userAgent: string, maxTouchPoints: number) => {
    vi.stubGlobal('navigator', { userAgent, maxTouchPoints })
  }

  it('iPhone を判定する', () => {
    stubNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 5)
    expect(isIos()).toBe(true)
  })

  it('タッチ可能な Macintosh UA は iPadOS とみなす', () => {
    stubNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)
    expect(isIos()).toBe(true)
  })

  it('タッチできない Mac は false', () => {
    stubNavigator('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)
    expect(isIos()).toBe(false)
  })
})

describe('isPushSupported', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('serviceWorker / PushManager / Notification が揃えば true', () => {
    vi.stubGlobal('navigator', { serviceWorker: {} })
    vi.stubGlobal('PushManager', class {})
    vi.stubGlobal('Notification', class {})
    expect(isPushSupported()).toBe(true)
  })

  it('serviceWorker が無ければ false', () => {
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('PushManager', class {})
    vi.stubGlobal('Notification', class {})
    expect(isPushSupported()).toBe(false)
  })
})
