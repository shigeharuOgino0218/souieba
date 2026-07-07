import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { List } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { LAST_LIST_KEY, ListEditor } from '@/components/ListEditor'
import { InviteDialog } from '@/components/InviteDialog'
import { MemberList } from '@/components/MemberList'

export default function ListPage() {
  const { listId } = useParams<{ listId: string }>()
  const { session } = useAuth()
  const navigate = useNavigate()
  const [list, setList] = useState<List | null>(null)
  const [listLoading, setListLoading] = useState(true)

  useEffect(() => {
    if (!listId) return
    supabase
      .from('lists')
      .select('*')
      .eq('id', listId)
      .maybeSingle()
      .then(({ data }) => {
        setList((data as List | null) ?? null)
        setListLoading(false)
      })
  }, [listId])

  const handleDelete = async () => {
    const { error } = await supabase.from('lists').delete().eq('id', listId!)
    if (error) {
      toast.error('リストの削除に失敗しました')
      return
    }
    if (localStorage.getItem(LAST_LIST_KEY) === listId) {
      localStorage.removeItem(LAST_LIST_KEY)
    }
    toast.success('リストを削除しました')
    navigate('/', { replace: true })
  }

  const isOwner = !!list && session?.user.id === list.owner_id

  if (!listLoading && !list) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          リストが見つかりません。削除されたか、アクセス権がない可能性があります。
        </p>
        <Button variant="outline" render={<Link to="/" />}>
          リスト一覧へ戻る
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <header className="mb-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          render={<Link to="/" aria-label="リスト一覧へ戻る" />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        {listLoading ? (
          <Skeleton className="h-6 w-32 flex-1" />
        ) : (
          <h1 className="flex-1 truncate text-lg font-semibold">{list!.name}</h1>
        )}
        <InviteDialog listId={listId!} />
        {isOwner && (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                  aria-label="リストを削除"
                />
              }
            >
              <Trash2 className="size-4" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>「{list!.name}」を削除しますか?</AlertDialogTitle>
                <AlertDialogDescription>
                  リスト内のアイテム・お店・メンバー情報もすべて削除されます。この操作は取り消せません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => void handleDelete()}
                >
                  削除する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </header>

      <div className="mb-4 px-2">
        <MemberList listId={listId!} />
      </div>

      <ListEditor listId={listId!} />
    </div>
  )
}
