import { CircleCheck, Repeat } from 'lucide-react'
import type { SweepNotice } from '@/lib/repeat'

/**
 * 朝の片付けの予告。チェック済みのアイテムがあるあいだ、ボトムメニューのすぐ上に固定して出し続ける。
 * リストの上に重なるので、半透明の背景をぼかして文字を読めるようにする。
 * 文字数を抑えるため「チェック済みのアイテム」と「リピ買いのアイテム」はアイコンで表し、
 * 読み上げ用の文字を添える。
 */
export function SweepBanner({ notice }: { notice: SweepNotice }) {
  return (
    <p className="rounded-2xl bg-muted/80 px-4 py-2 text-xs text-muted-foreground backdrop-blur">
      <CircleCheck
        className="inline size-3.5 align-[-0.2em]"
        aria-hidden="true"
      />
      <span className="sr-only">チェック済みのアイテム</span>
      {notice === 'return'
        ? ' は朝 4:00 にリピ買いに戻ります'
        : ' は朝 4:00 に削除されます'}
      {notice === 'mixed' && (
        <>
          （
          <Repeat
            className="inline size-3.5 align-[-0.2em]"
            aria-hidden="true"
          />
          <span className="sr-only">リピ買いのアイテム</span>
          {' はリピ買いに戻ります'}）
        </>
      )}
    </p>
  )
}
