import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { List } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ListEditor } from '@/components/ListEditor'
import { InviteDialog } from '@/components/InviteDialog'
import { MemberList } from '@/components/MemberList'

export default function ListPage() {
  const { listId } = useParams<{ listId: string }>()
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

  if (!listLoading && !list) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          リストが見つかりません。削除されたか、アクセス権がない可能性があります。
        </p>
        <Button asChild variant="outline">
          <Link to="/">リスト一覧へ戻る</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <header className="mb-4 flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link to="/" aria-label="リスト一覧へ戻る">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        {listLoading ? (
          <Skeleton className="h-6 w-32 flex-1" />
        ) : (
          <h1 className="flex-1 truncate text-lg font-semibold">{list!.name}</h1>
        )}
        <InviteDialog listId={listId!} />
      </header>

      <div className="mb-4 px-2">
        <MemberList listId={listId!} />
      </div>

      <ListEditor listId={listId!} />
    </div>
  )
}
