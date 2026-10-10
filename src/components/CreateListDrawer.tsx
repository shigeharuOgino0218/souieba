import { useRef, useState, type RefObject, type SubmitEvent } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { List } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * 買い物リストを新しく作るドロワー。開閉は呼び出し元が制御する。
 * DB への追加が成功してから onCreated で作成したリストを渡し、失敗したら開いたままエラーを出す。
 * 他のドロワーの中に置けば、その上に重なるネストしたドロワーとして開く。
 */
export function CreateListDrawer({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (list: List) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Drawer showSwipeHandle={true} open={open} onOpenChange={onOpenChange}>
      <DrawerContent initialFocus={inputRef}>
        <DrawerHeader>
          <DrawerTitle>買い物リストを追加</DrawerTitle>
        </DrawerHeader>
        <CreateListForm inputRef={inputRef} onCreated={onCreated} />
      </DrawerContent>
    </Drawer>
  )
}

/** 名前の入力と作成。ドロワーを閉じるとアンマウントされるので、開き直すたびに入力欄は空から始まる。 */
function CreateListForm({
  inputRef,
  onCreated,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  onCreated: (list: List) => void
}) {
  const { session } = useAuth()
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const trimmed = name.trim()

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!trimmed || !session) return
    setCreating(true)
    const { data, error } = await supabase
      .from('lists')
      .insert({ name: trimmed, owner_id: session.user.id })
      .select()
      .single()
    setCreating(false)
    if (error || !data) {
      toast.error('リストの作成に失敗しました')
      return
    }
    onCreated(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-6">
      <div className="space-y-2">
        <Label htmlFor="newListName">リスト名</Label>
        <Input
          ref={inputRef}
          id="newListName"
          placeholder="例: いつもの買い物"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={creating || trimmed === ''}
      >
        {creating ? '追加中…' : '追加'}
      </Button>
    </form>
  )
}
