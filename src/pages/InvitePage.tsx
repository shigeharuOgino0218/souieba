import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { InviteInfo } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [info, setInfo] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!token) return
    supabase
      .rpc('get_invite_info', { invite_token: token })
      .then(({ data }) => {
        setInfo((data as InviteInfo[] | null)?.[0] ?? null)
        setLoading(false)
      })
  }, [token])

  const handleJoin = async () => {
    setJoining(true)
    const { data, error } = await supabase.rpc('accept_invite', {
      invite_token: token,
    })
    setJoining(false)
    if (error || !data) {
      toast.error('参加に失敗しました。招待が無効か期限切れの可能性があります。')
      return
    }
    toast.success('リストに参加しました')
    navigate(`/lists/${data as string}`, { replace: true })
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        {loading ? (
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
        ) : !info ? (
          <>
            <CardHeader>
              <CardTitle>無効な招待です</CardTitle>
              <CardDescription>
                この招待URLは存在しないか、すでに削除されています。
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">リスト一覧へ</Link>
              </Button>
            </CardFooter>
          </>
        ) : info.expired ? (
          <>
            <CardHeader>
              <CardTitle>招待の有効期限が切れています</CardTitle>
              <CardDescription>
                「{info.list_name}」のメンバーに新しい招待URLを発行してもらってください。
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">リスト一覧へ</Link>
              </Button>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>「{info.list_name}」に招待されています</CardTitle>
              <CardDescription>
                参加するとこの買い物リストを一緒に編集できます。
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-2">
              <Button
                className="w-full"
                disabled={joining}
                onClick={() => void handleJoin()}
              >
                {joining ? '参加中…' : '参加する'}
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/">参加しない</Link>
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
}
