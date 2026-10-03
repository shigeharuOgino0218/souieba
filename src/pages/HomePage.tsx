import { useEffect, useState, type SubmitEvent } from 'react'
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
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import {
  pickAfterRemoval,
  pickInitialListId,
  readRequestedListId,
} from '@/lib/lists'
import type { List } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { MemberList } from '@/components/MemberList'
import { InviteDrawer } from '@/components/InviteDrawer'
import { ListMenuDrawer } from '@/components/ListMenuDrawer'
import logo from '@/assets/logo.svg'

const MAX_TAB_AVATARS = 3

export default function HomePage() {
  const { session, signOut } = useAuth()
  const { profile } = useMyProfile()
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  // 通知や招待から来たときに開くリスト。マウント時の location.state だけを使い、以降の変化には追従しない
  const [requestedId] = useState(() => readRequestedListId(location.state))

  // 再読み込みで指定のタブに戻されないよう、受け取った state は履歴から消す
  useEffect(() => {
    if (readRequestedListId(location.state)) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.state, location.pathname, navigate])

  // 指定されたリスト → 最後に編集していたリスト → 先頭の順で、最初に選ぶタブを決める
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

  const handleCreate = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name || !session) return
    setCreating(true)
    const { data, error } = await supabase
      .from('lists')
      .insert({ name, owner_id: session.user.id })
      .select()
      .single()
    setCreating(false)
    if (error || !data) {
      toast.error('リストの作成に失敗しました')
      return
    }
    setLists((prev) => [...prev, data])
    setActiveId(data.id)
    setDialogOpen(false)
    setNewName('')
  }

  const handleRenamed = (id: string, name: string) => {
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)))
  }

  const handleDeleted = (id: string) => {
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
      <header className="mb-2 flex h-16 items-center justify-between px-4">
        <h1>
          <img src={logo} alt="そういえば" className="h-6" />
        </h1>
        <Drawer showSwipeHandle={true}>
          <DrawerTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-fit w-fit border-none"
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
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-[84px] w-36 rounded-2xl" />
            <Skeleton className="h-[84px] w-36 rounded-2xl" />
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <Tabs value={activeId} onValueChange={(v) => setActiveId(v as string)}>
          <div className="flex snap-x snap-mandatory scroll-pl-4 [scrollbar-width:none] items-stretch gap-2 overflow-x-auto overflow-y-hidden px-4 [&::-webkit-scrollbar]:hidden">
            <TabsList className="gap-2 rounded-none bg-transparent p-0 group-data-horizontal/tabs:h-auto">
              {lists.map((list) => (
                // メニューのボタンをタブ(button)の中に入れると入れ子になるため、兄弟として右上に重ねる
                <div
                  key={list.id}
                  className="relative w-[min(180px,42vw)] flex-none snap-start"
                >
                  <TabsTrigger
                    value={list.id}
                    className="group/tab h-auto w-full flex-col items-start justify-between gap-3 rounded-xl bg-muted p-3 text-foreground dark:text-foreground data-active:bg-primary data-active:text-primary-foreground dark:data-active:bg-primary dark:data-active:text-primary-foreground"
                  >
                    <span className="max-w-full truncate pr-6 font-bold">
                      {list.name}
                    </span>
                    <span className="flex min-h-8 items-center">
                      <MemberList
                        listId={list.id}
                        maxVisible={MAX_TAB_AVATARS}
                        avatarClassName="ring-muted group-data-active/tab:ring-primary"
                      />
                    </span>
                  </TabsTrigger>
                  <ListMenuDrawer
                    list={list}
                    onRenamed={(name) => handleRenamed(list.id, name)}
                    onDeleted={() => handleDeleted(list.id)}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className={cn(
                          'absolute top-1.5 right-1.5',
                          list.id === activeId
                            ? 'text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground aria-expanded:bg-primary-foreground/15 aria-expanded:text-primary-foreground dark:hover:bg-primary-foreground/15'
                            : 'hover:bg-foreground/10 aria-expanded:bg-foreground/10 dark:hover:bg-foreground/10',
                        )}
                        aria-label={`${list.name}のメニュー`}
                      />
                    }
                  >
                    <EllipsisVertical />
                  </ListMenuDrawer>
                </div>
              ))}
            </TabsList>
            <Button
              variant="secondary"
              className="grid h-auto w-[min(180px,42vw)] snap-start items-center rounded-xl border-border p-3"
              onClick={() => setDialogOpen(true)}
            >
              <span className="max-w-full truncate font-bold">
                買い物リストを追加
              </span>
              <CirclePlus className="mx-auto size-6" />
            </Button>
          </div>
          {lists.map((list) => (
            <TabsContent key={list.id} value={list.id} className="mt-2 px-4">
              <ListEditor
                listId={list.id}
                action={
                  <div className="flex items-center rounded-full border bg-background p-0.5 dark:bg-muted">
                    <InviteDrawer
                      listId={list.id}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`${list.name}を共有`}
                        />
                      }
                    >
                      <Share />
                    </InviteDrawer>
                  </div>
                }
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setNewName('')
        }}
      >
        <DialogContent className="top-24 translate-y-0 sm:top-1/2 sm:max-w-md sm:-translate-y-1/2">
          <DialogHeader>
            <DialogTitle>買い物リストを追加</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="listName">リスト名</Label>
              <Input
                id="listName"
                autoFocus
                placeholder="例: いつもの買い物"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={creating || newName.trim() === ''}
              >
                {creating ? '追加中…' : '追加'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
