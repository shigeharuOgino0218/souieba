import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { UserAvatar } from '@/components/UserAvatar'

type Member = {
  user_id: string
  role: 'owner' | 'member'
  display_name: string
  avatar_icon: string | null
  avatar_color: string | null
}

type MemberRow = {
  user_id: string
  role: 'owner' | 'member'
  profiles: {
    display_name: string
    avatar_icon: string | null
    avatar_color: string | null
  } | null
}

const MAX_VISIBLE = 5

export function MemberList({ listId }: { listId: string }) {
  const [members, setMembers] = useState<Member[]>([])

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('list_members')
      .select('user_id, role, profiles(display_name, avatar_icon, avatar_color)')
      .eq('list_id', listId)
      .order('created_at')
    setMembers(
      ((data as MemberRow[] | null) ?? []).map((row) => ({
        user_id: row.user_id,
        role: row.role,
        display_name: row.profiles?.display_name || '名無し',
        avatar_icon: row.profiles?.avatar_icon ?? null,
        avatar_color: row.profiles?.avatar_color ?? null,
      })),
    )
  }, [listId])

  useEffect(() => {
    void load()
    const channel = supabase
      .channel(`members-${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'list_members',
          filter: `list_id=eq.${listId}`,
        },
        () => void load(),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [listId, load])

  if (members.length === 0) return null

  const visible = members.slice(0, MAX_VISIBLE)
  const extra = members.length - visible.length

  return (
    <Popover>
      <PopoverTrigger
        aria-label="メンバー一覧を表示"
        className="flex items-center -space-x-1.5"
      >
        {visible.map((member) => (
          <UserAvatar
            key={member.user_id}
            icon={member.avatar_icon}
            color={member.avatar_color}
            size="md"
            className="ring-2 ring-background"
          />
        ))}
        {extra > 0 && (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground ring-2 ring-background">
            +{extra}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <ul className="space-y-1">
          {members.map((member) => (
            <li
              key={member.user_id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
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
      </PopoverContent>
    </Popover>
  )
}
