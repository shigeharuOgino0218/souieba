import { describe, expect, it } from 'vitest'
import {
  AVATAR_ICONS,
  DEFAULT_AVATAR_COLOR,
  DEFAULT_AVATAR_ICON,
  resolveAvatar,
} from '@/lib/avatars'

const DEFAULT_COLOR_CLASS = 'bg-slate-200 text-slate-800'

describe('resolveAvatar', () => {
  it('既知のアイコンと色を解決する', () => {
    const { Icon, colorClass } = resolveAvatar('cat', 'red')
    expect(Icon).toBe(AVATAR_ICONS.cat)
    expect(colorClass).toBe('bg-red-200 text-red-800')
  })

  it('null は既定値にフォールバックする', () => {
    const { Icon, colorClass } = resolveAvatar(null, null)
    expect(Icon).toBe(AVATAR_ICONS[DEFAULT_AVATAR_ICON])
    expect(colorClass).toBe(DEFAULT_COLOR_CLASS)
  })

  it('未知のキーは既定値にフォールバックする', () => {
    const { Icon, colorClass } = resolveAvatar('no-such-icon', 'no-such-color')
    expect(Icon).toBe(AVATAR_ICONS[DEFAULT_AVATAR_ICON])
    expect(colorClass).toBe(DEFAULT_COLOR_CLASS)
  })

  it('既定値のキーが定義済みである', () => {
    expect(AVATAR_ICONS[DEFAULT_AVATAR_ICON]).toBeDefined()
    expect(DEFAULT_AVATAR_COLOR).toBe('slate')
  })
})
