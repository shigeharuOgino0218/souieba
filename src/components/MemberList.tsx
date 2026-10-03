import { cn } from '@/lib/utils'
import { useListMembers } from '@/hooks/useListMembers'
import { UserAvatar } from '@/components/UserAvatar'

const MAX_VISIBLE = 5

/** メンバーのアバターを重ねて並べる。maxVisible を超えた分は「+N」にまとめる。 */
export function MemberList({
  listId,
  maxVisible = MAX_VISIBLE,
  avatarClassName,
}: {
  listId: string
  maxVisible?: number
  avatarClassName?: string
}) {
  const members = useListMembers(listId)

  if (members.length === 0) return null

  const visible = members.slice(0, maxVisible)
  const extra = members.length - visible.length

  return (
    <span className="flex items-center -space-x-1.5">
      {visible.map((member) => (
        <UserAvatar
          key={member.user_id}
          icon={member.avatar_icon}
          color={member.avatar_color}
          size="sm"
          className={cn('ring-2 ring-background', avatarClassName)}
        />
      ))}
      {extra > 0 && (
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground ring-2 ring-background',
            avatarClassName,
          )}
        >
          +{extra}
        </span>
      )}
    </span>
  )
}
