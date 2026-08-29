import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyToClipboard } from '@/lib/clipboard'

const stubExecCommand = (result: boolean | (() => never)) => {
  const execCommand = vi.fn(
    typeof result === 'function' ? result : () => result,
  )
  Object.defineProperty(document, 'execCommand', {
    value: execCommand,
    configurable: true,
    writable: true,
  })
  return execCommand
}

describe('copyToClipboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(document, 'execCommand')
  })

  it('navigator.clipboard が使えればそれで書き込む', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await expect(copyToClipboard('hello')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('hello')
  })

  it('clipboard が失敗したら textarea にフォールバックする', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const execCommand = stubExecCommand(true)

    await expect(copyToClipboard('hello')).resolves.toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
  })

  it('clipboard が無ければ textarea を使う', async () => {
    vi.stubGlobal('navigator', {})
    const execCommand = stubExecCommand(true)

    await expect(copyToClipboard('hello')).resolves.toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
  })

  it('execCommand が投げても false を返し textarea を残さない', async () => {
    vi.stubGlobal('navigator', {})
    stubExecCommand(() => {
      throw new Error('not supported')
    })

    await expect(copyToClipboard('hello')).resolves.toBe(false)
    expect(document.querySelector('textarea')).toBeNull()
  })
})
