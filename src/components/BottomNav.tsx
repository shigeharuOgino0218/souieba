import { NavLink } from 'react-router-dom'
import { CircleCheck, Repeat, Utensils } from 'lucide-react'

const TABS = [
  { to: '/', label: '買い物リスト', Icon: CircleCheck },
  { to: '/repeat', label: 'リピ買い', Icon: Repeat },
  { to: '/meals', label: '献立', Icon: Utensils },
]

/**
 * 画面下に固定する3タブのメニュー。選択中のタブはアイコンの背後のピルで示す。
 * 高さは index.css の --bottom-nav-height と揃え、iOS の PWA ではホームインジケーターの分だけ下に余白を足す。
 * ラベルは文字サイズの段階 (text-xs など) から外れる例外として 11px にしている。
 */
export function BottomNav() {
  return (
    <nav
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
