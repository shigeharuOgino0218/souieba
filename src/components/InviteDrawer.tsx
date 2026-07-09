import { useState, type ReactElement, type ReactNode } from 'react'
import { Check, Copy, Share } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { copyToClipboard } from '@/lib/clipboard'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'

export function InviteDrawer({
  listId,
  trigger,
  children,
}: {
  listId: string
  trigger?: ReactElement
  children?: ReactNode
}) {
  const { session } = useAuth()
  const [url, setUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleOpenChange = async (open: boolean) => {
    setCopied(false)
    if (!open || url || !session) return
    const { data, error } = await supabase
      .from('invites')
      .insert({ list_id: listId, created_by: session.user.id })
      .select('token')
      .single()
    if (error || !data) {
      toast.error('招待URLの作成に失敗しました')
      return
    }
    setUrl(`${window.location.origin}/invite/${(data as { token: string }).token}`)
  }

  const handleCopy = async () => {
    if (!url) return
    const ok = await copyToClipboard(url)
    if (!ok) {
      toast.error('コピーできませんでした。URLを選択して手動でコピーしてください')
      return
    }
    setCopied(true)
    toast.success('招待URLをコピーしました')
  }

  return (
    <Drawer
      showSwipeHandle={true}
      onOpenChange={(open) => void handleOpenChange(open)}
    >
      <DrawerTrigger render={trigger ?? <Button variant="outline" size="sm" />}>
        {children ?? (
          <>
            <Share className="size-4" />
            共有
          </>
        )}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>招待URLを発行しました</DrawerTitle>
          <DrawerDescription>
            このURLを共有すると開いた人がこのリストに参加して一緒に編集できます(有効期限7日)。
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex items-center gap-2 px-4 pb-6">
          <Input
            readOnly
            value={url ?? '作成中…'}
            onFocus={(e) => e.target.select()}
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={() => void handleCopy()}
            disabled={!url}
            aria-label="招待URLをコピー"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
