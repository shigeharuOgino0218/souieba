import { useEffect, useState, type SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CircleUserRound,
  LogOut,
  CirclePlus,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { List } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

  useEffect(() => {
    supabase
      .from('lists')
      .select('*')
      .order('created_at')
      .then(({ data, error }) => {
        if (error) toast.error('リストの取得に失敗しました')
        const fetched = (data as List[]) ?? []
        setLists(fetched)
        // 最後に編集していたリストのタブを選択した状態で表示する
        const lastId = localStorage.getItem(LAST_LIST_KEY)
        setActiveId(
          lastId && fetched.some((l) => l.id === lastId)
            ? lastId
            : (fetched[0]?.id ?? null),
        )
        setLoading(false)
      })
  }, [])

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
    const created = data as List
    setLists((prev) => [...prev, created])
    setActiveId(created.id)
    setDialogOpen(false)
    setNewName('')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="flex justify-between items-center h-16 mb-4 px-4">
        <h1>
          <img src={logo} alt="そういえば" className="h-6" />
        </h1>
        <Drawer>
          <DrawerTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="w-fit h-fit border-none"
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
              <DrawerTitle>アカウント</DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-1 px-4 pb-6">
              <Button
                variant="ghost"
                className="h-12 justify-start text-base"
                render={<Link to="/settings" />}
              >
                <Settings className="size-5" />
                アカウント設定
              </Button>
              <DrawerClose
                render={
                  <Button
                    variant="ghost"
                    className="h-12 justify-start text-base"
                    onClick={() => void signOut()}
                  />
                }
              >
                <LogOut className="size-5" />
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
          <div className="flex snap-x snap-mandatory items-stretch gap-2 overflow-x-auto overflow-y-hidden px-4 scroll-pl-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="gap-2 rounded-none bg-transparent p-0 group-data-horizontal/tabs:h-auto">
              {lists.map((list) => (
                <TabsTrigger
                  key={list.id}
                  value={list.id}
                  className="group/tab h-auto w-[min(180px,42vw)] flex-none snap-start flex-col items-start justify-between gap-3 rounded-xl bg-muted p-3 text-foreground data-active:bg-primary data-active:text-primary-foreground dark:text-foreground dark:data-active:bg-primary dark:data-active:text-primary-foreground"
                >
                  <span className="max-w-full truncate font-bold">
                    {list.name}
                  </span>
                  <span className="flex min-h-8 items-center">
                    <MemberList
                      listId={list.id}
                      maxVisible={MAX_TAB_AVATARS}
                      popover={false}
                      avatarClassName="ring-muted group-data-active/tab:ring-primary"
                    />
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            <Button
              variant="secondary"
              className="h-auto w-[min(180px,42vw)] grid items-center border-border snap-start rounded-xl p-3"
              onClick={() => setDialogOpen(true)}
            >
              <span className="max-w-full truncate font-bold">買い物リストを追加</span>
              <CirclePlus className="size-6 mx-auto" />
            </Button>
          </div>
          {lists.map((list) => (
            <TabsContent key={list.id} value={list.id} className="mt-6 px-4">
              <ListEditor
                listId={list.id}
                action={
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-lg text-muted-foreground"
                    render={
                      <Link
                        to={`/lists/${list.id}`}
                        aria-label={`${list.name}を開く`}
                      />
                    }
                  >
                    <ArrowUpRight />
                  </Button>
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
        <DialogContent className="top-24 translate-y-0 sm:top-1/2 sm:-translate-y-1/2 sm:max-w-md">
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
              <Button type="submit" disabled={creating || newName.trim() === ''}>
                {creating ? '追加中…' : '追加'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
