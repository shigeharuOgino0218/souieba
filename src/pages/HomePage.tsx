import { useEffect, useState, type SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  ChevronRight,
  CircleUserRound,
  ListChecks,
  LogOut,
  Plus,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { List } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export default function HomePage() {
  const { session, signOut } = useAuth()
  const { profile } = useMyProfile()
  const navigate = useNavigate()
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('lists')
      .select('*')
      .order('created_at')
      .then(({ data, error }) => {
        if (error) toast.error('リストの取得に失敗しました')
        const fetched = (data as List[]) ?? []
        setLists(fetched)
        // 最後に編集していたリストを展開した状態で表示する
        const lastId = localStorage.getItem(LAST_LIST_KEY)
        if (lastId && fetched.some((l) => l.id === lastId)) setExpandedId(lastId)
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
    navigate(`/lists/${(data as List).id}`)
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <ListChecks className="size-5" />
          そういえば
        </h1>
        <Drawer>
          <DrawerTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground"
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
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : lists.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          まだリストがありません。最初のリストを作成しましょう。
        </p>
      ) : (
        <div className="space-y-2">
          {lists.map((list) => {
            const expanded = list.id === expandedId
            return (
              <Card key={list.id} className="gap-0 p-0">
                <div className="flex items-center">
                  <button
                    type="button"
                    className="flex flex-1 items-center gap-2 px-4 py-4 text-sm font-bold"
                    aria-expanded={expanded}
                    onClick={() => setExpandedId(expanded ? null : list.id)}
                  >
                    <ChevronRight
                      className={cn(
                        'size-4 text-muted-foreground transition-transform',
                        expanded && 'rotate-90',
                      )}
                    />
                    {list.name}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mr-2 text-muted-foreground"
                    render={
                      <Link
                        to={`/lists/${list.id}`}
                        aria-label={`${list.name}を開く`}
                      />
                    }
                  >
                    <ArrowUpRight className="size-4" />
                  </Button>
                </div>
                {expanded && (
                  <div className="border-t p-2">
                    <ListEditor listId={list.id} />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setNewName('')
        }}
      >
        <DialogTrigger render={<Button variant="outline" className="mt-6 w-full" />}>
          <Plus className="size-4" />
          買い物リスト追加
        </DialogTrigger>
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
