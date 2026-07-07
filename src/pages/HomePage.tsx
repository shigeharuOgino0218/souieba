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
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground"
              aria-label="アカウントメニュー"
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
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings className="size-4" />
                アカウント設定
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void signOut()}>
              <LogOut className="size-4" />
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <Input
          placeholder="新しいリスト名(例: いつもの買い物)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button type="submit" disabled={creating || newName.trim() === ''}>
          <Plus className="size-4" />
          作成
        </Button>
      </form>

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
                    className="flex flex-1 items-center gap-2 px-4 py-4 text-sm font-medium"
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
                    asChild
                    variant="ghost"
                    size="icon"
                    className="mr-2 text-muted-foreground"
                  >
                    <Link to={`/lists/${list.id}`} aria-label={`${list.name}を開く`}>
                      <ArrowUpRight className="size-4" />
                    </Link>
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
    </div>
  )
}
