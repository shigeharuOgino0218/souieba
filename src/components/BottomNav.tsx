import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { CircleCheck, Repeat, Utensils } from 'lucide-react'

const TABS = [
  { to: '/', label: '買い物リスト', Icon: CircleCheck },
  { to: '/repeat', label: 'リピ買い', Icon: Repeat },
  { to: '/meals', label: '献立', Icon: Utensils },
]

// キーボードを出さない input。チェックボックスやスイッチは button で描いているので、そもそも input ではない
const NON_TEXT_INPUT_TYPES = new Set([
  'checkbox',
  'radio',
  'button',
  'submit',
  'reset',
  'range',
  'color',
  'file',
  'image',
  'hidden',
])

function opensKeyboard(el: Element | null): boolean {
  if (el instanceof HTMLTextAreaElement) return true
  if (el instanceof HTMLInputElement) return !NON_TEXT_INPUT_TYPES.has(el.type)
  return el instanceof HTMLElement && el.isContentEditable
}

/**
 * 入力欄にフォーカスしているあいだ、ルート要素に data-input-focused を付ける。
 * index.css がこれを見てボトムメニューを隠し、--bottom-nav-height を 0 にする。
 */
function useInputFocusedAttribute() {
  useEffect(() => {
    const root = document.documentElement
    const update = () =>
      root.toggleAttribute(
        'data-input-focused',
        opensKeyboard(document.activeElement),
      )
    // focusout の時点では次の入力欄にまだフォーカスが移っていない。移り終わってから判定し、Enter で行を移るたびにメニューが一瞬出るのを防ぐ
    const updateAfterFocusMoves = () => setTimeout(update)
    document.addEventListener('focusin', update)
    document.addEventListener('focusout', updateAfterFocusMoves)
    // フォーカス中の入力欄が DOM から消えると focusout が来ないブラウザがあるので、キーボードの開閉でも判定し直す
    window.visualViewport?.addEventListener('resize', update)
    return () => {
      document.removeEventListener('focusin', update)
      document.removeEventListener('focusout', updateAfterFocusMoves)
      window.visualViewport?.removeEventListener('resize', update)
      root.removeAttribute('data-input-focused')
    }
  }, [])
}

/**
 * 画面下に固定する3タブのメニュー。選択中のタブはアイコンの背後のピルで示す。
 * 高さは index.css の --bottom-nav-height と揃え、iOS の PWA ではホームインジケーターの分だけ下に余白を足す。
 * ラベルは文字サイズの段階 (text-xs など) から外れる例外として 11px にしている。
 * 入力欄にフォーカスしているあいだは隠す(index.css)。
 */
export function BottomNav() {
  useInputFocusedAttribute()

  return (
    <nav
      data-slot="bottom-nav"
      aria-label="メインメニュー"
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-background pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto grid h-16 max-w-2xl grid-cols-3">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className="group flex flex-col items-center justify-center gap-1 text-[11px]"
          >
            <span className="flex h-8 w-16 items-center justify-center rounded-full transition-colors group-aria-[current=page]:bg-secondary">
              <Icon className="size-5" />
            </span>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
