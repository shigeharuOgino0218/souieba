import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  CircleUserRound,
  CirclePlus,
  EllipsisVertical,
  Share,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  pickAfterRemoval,
  pickInitialListId,
  readRequestedListId,
} from '@/lib/lists'
import type { List } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { UserAvatar } from '@/components/UserAvatar'
import { useMyProfile } from '@/hooks/useMyProfile'
import { LAST_LIST_KEY, ListEditor } from '@/components/ListEditor'
import { InviteDrawer } from '@/components/InviteDrawer'
import { ListMenuDrawer } from '@/components/ListMenuDrawer'
import { ListSwitcherDrawer } from '@/components/ListSwitcherDrawer'
import { CreateListDrawer } from '@/components/CreateListDrawer'

export default function HomePage() {
  const { signOut } = useAuth()
  const { profile } = useMyProfile()
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  // 通知や招待から来たときに開くリスト。マウント時の location.state だけを使い、以降の変化には追従しない
  const [requestedId] = useState(() => readRequestedListId(location.state))
  const active = lists.find((l) => l.id === activeId)

  // 再読み込みで指定のリストに戻されないよう、受け取った state は履歴から消す
  useEffect(() => {
    if (readRequestedListId(location.state)) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.state, location.pathname, navigate])

  // 指定されたリスト → 最後に編集していたリスト → 先頭の順で、最初に開くリストを決める
  useEffect(() => {
    supabase
      .from('lists')
      .select('*')
      .order('created_at')
      .then(({ data, error }) => {
        if (error) toast.error('リストの取得に失敗しました')
        const fetched = data ?? []
        const ids = fetched.map((l) => l.id)
        if (!error && requestedId && !ids.includes(requestedId)) {
          toast.error(
            'リストが見つかりません。削除されたか、アクセス権がない可能性があります。',
          )
        }
        setLists(fetched)
        setActiveId(
          pickInitialListId(
            ids,
            requestedId,
            localStorage.getItem(LAST_LIST_KEY),
          ),
        )
        setLoading(false)
      })
  }, [requestedId])

  const handleCreated = (list: List) => {
    setLists((prev) => [...prev, list])
    setActiveId(list.id)
    setCreateOpen(false)
  }

  const handleRenamed = (id: string, name: string) => {
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)))
  }

  // 削除・退会のどちらでもリストが手元から消えるので、選択中なら隣のリストに移す
  const handleRemoved = (id: string) => {
    if (localStorage.getItem(LAST_LIST_KEY) === id) {
      localStorage.removeItem(LAST_LIST_KEY)
    }
    setActiveId(
      pickAfterRemoval(
        lists.map((l) => l.id),
        id,
        activeId,
      ),
    )
    setLists((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-2 flex h-16 items-center justify-between gap-4 px-4">
        <h1 className="-ml-2 min-w-0">
          {loading ? (
            <Skeleton className="ml-2 h-6 w-40" />
          ) : (
            <ListSwitcherDrawer
              lists={lists}
              activeId={activeId}
              onSelect={setActiveId}
              onCreated={handleCreated}
            />
          )}
        </h1>
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
      </header>

      {loading ? (
        <div className="space-y-2 px-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : active ? (
        <div className="mt-2 px-4">
          {/* リストごとに入力中の状態や購読を持つので、切り替えたら作り直す */}
          <ListEditor
            key={active.id}
            listId={active.id}
            action={
              <div className="flex items-center rounded-full border bg-background p-0.5 dark:bg-muted">
                <InviteDrawer
                  listId={active.id}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${active.name}を共有`}
                    />
                  }
                >
                  <Share />
                </InviteDrawer>
                <ListMenuDrawer
                  list={active}
                  onRenamed={(name) => handleRenamed(active.id, name)}
                  onRemoved={() => handleRemoved(active.id)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${active.name}のメニュー`}
                    />
                  }
                >
                  <EllipsisVertical />
                </ListMenuDrawer>
              </div>
            }
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
          <p className="text-muted-foreground">買い物リストがありません</p>
          <Button onClick={() => setCreateOpen(true)}>
            <CirclePlus data-icon="inline-start" />
            買い物リストを追加
          </Button>
        </div>
      )}

      {/* 作成するとリストが 1 件になり空の案内が消えるので、閉じるアニメーションを残すため分岐の外に置く */}
      <CreateListDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </div>
  )
}
