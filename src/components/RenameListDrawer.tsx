import { useRef, useState, type RefObject, type SubmitEvent } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
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
 * 買い物リストの名前を変更するドロワー。開閉は呼び出し元が制御する。
 * DB の更新が成功してから onRenamed で新しい名前を渡し、失敗したら開いたままエラーを出す。
 * 他のドロワーの中に置けば、その上に重なるネストしたドロワーとして開く。
 */
export function RenameListDrawer({
  listId,
  currentName,
  open,
  onOpenChange,
  onRenamed,
}: {
  listId: string
  currentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onRenamed: (name: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Drawer showSwipeHandle={true} open={open} onOpenChange={onOpenChange}>
      <DrawerContent initialFocus={inputRef}>
        <DrawerHeader>
          <DrawerTitle>リストの名前を変更</DrawerTitle>
        </DrawerHeader>
        <RenameListForm
          listId={listId}
          currentName={currentName}
          inputRef={inputRef}
          onRenamed={onRenamed}
        />
      </DrawerContent>
    </Drawer>
  )
}

/**
 * 名前の入力と保存。ドロワーを閉じるとアンマウントされるので、
 * 開き直すたびに入力欄は現在の名前から始まる。
 */
function RenameListForm({
  listId,
  currentName,
  inputRef,
  onRenamed,
}: {
  listId: string
  currentName: string
  inputRef: RefObject<HTMLInputElement | null>
  onRenamed: (name: string) => void
}) {
  const [name, setName] = useState(currentName)
  const [saving, setSaving] = useState(false)
  const trimmed = name.trim()

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!trimmed || trimmed === currentName) return
    setSaving(true)
    const { data, error } = await supabase
      .from('lists')
      .update({ name: trimmed })
      .eq('id', listId)
      .select('name')
      .single()
    setSaving(false)
    if (error || !data) {
      toast.error('名前の変更に失敗しました')
      return
    }
    onRenamed(data.name)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-6">
      <div className="space-y-2">
        <Label htmlFor={`listName-${listId}`}>リスト名</Label>
        <Input
          ref={inputRef}
          id={`listName-${listId}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={saving || trimmed === '' || trimmed === currentName}
      >
        {saving ? '保存中…' : '保存'}
      </Button>
    </form>
  )
}
