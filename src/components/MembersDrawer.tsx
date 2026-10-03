import { useListMembers } from '@/hooks/useListMembers'
import { Badge } from '@/components/ui/badge'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { UserAvatar } from '@/components/UserAvatar'

/**
 * リストのメンバー一覧(名前とオーナーかどうか)を見せるドロワー。開閉は呼び出し元が制御する。
 * 他のドロワーの中に置けば、その上に重なるネストしたドロワーとして開く。
 */
export function MembersDrawer({
  listId,
  open,
  onOpenChange,
}: {
  listId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Drawer showSwipeHandle={true} open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>メンバー</DrawerTitle>
        </DrawerHeader>
        <MemberRows listId={listId} />
      </DrawerContent>
    </Drawer>
  )
}

/** ドロワーを開いている間だけマウントされ、その間だけメンバーを購読する。 */
function MemberRows({ listId }: { listId: string }) {
  const members = useListMembers(listId)

  return (
    <ul className="space-y-1 px-4 pb-6">
      {members.map((member) => (
        <li
          key={member.user_id}
          className="flex items-center gap-3 rounded-md px-2 py-2 text-base"
        >
          <UserAvatar
            icon={member.avatar_icon}
            color={member.avatar_color}
            size="md"
          />
          <span className="flex-1 truncate">{member.display_name}</span>
          {member.role === 'owner' && (
            <Badge variant="secondary">オーナー</Badge>
          )}
        </li>
      ))}
    </ul>
  )
}
