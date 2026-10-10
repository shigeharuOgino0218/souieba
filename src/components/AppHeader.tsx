import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CircleUserRound } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useMyProfile } from '@/hooks/useMyProfile'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { UserAvatar } from '@/components/UserAvatar'

/**
 * タブの画面に共通のヘッダー。左に見出しと画面ごとの操作を並べ、右端にアカウントメニューを置く。
 * 見出しのボタン(リストの切り替え)は左に余白を持つので、h1 を同じだけ左へずらして端を揃える。
 * 見出しが長いときは見出しの方を省略し、操作は縮めない。
 */
export function AppHeader({
  title,
  actions,
}: {
  title: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="mb-2 flex h-16 items-center justify-between gap-4 px-4">
      <div className="flex min-w-0 items-center gap-1">
        <h1 className="-ml-2 min-w-0">{title}</h1>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <AccountMenuDrawer />
    </header>
  )
}

function AccountMenuDrawer() {
  const { signOut } = useAuth()
  const { profile } = useMyProfile()

  return (
    <Drawer showSwipeHandle={true}>
      <DrawerTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-fit w-fit shrink-0 border-none"
            aria-label="アカウントメニュー"
          />
        }
      >
        {profile ? (
          <UserAvatar
            icon={profile.avatar_icon}
            color={profile.avatar_color}
            size="md"
          />
        ) : (
          <CircleUserRound className="size-5" />
        )}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>設定</DrawerTitle>
        </DrawerHeader>
        <div className="grid px-4 pb-6">
          <Button
            variant="ghost"
            className="h-12 gap-3 text-base"
            render={<Link to="/settings" />}
          >
            <CircleUserRound data-icon="inline" className="size-5" />
            アカウント設定
            <ArrowUpRight className="ml-auto text-muted-foreground" />
          </Button>
          <Separator className="my-1" />
          <DrawerClose
            render={
              <Button
                variant="destructive"
                className="mt-4 w-fit"
                onClick={() => void signOut()}
              />
            }
          >
            ログアウト
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
