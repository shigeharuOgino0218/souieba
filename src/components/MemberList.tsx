import { useCallback, useEffect, useState } from 'react'
import { Crown, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
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

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Users className="size-3.5 text-muted-foreground" />
      {members.map((member) => (
        <Badge
          key={member.user_id}
          variant="outline"
          className="gap-1 py-0.5 pl-1 font-normal"
        >
          <UserAvatar
            icon={member.avatar_icon}
            color={member.avatar_color}
            size="sm"
          />
          {member.display_name}
          {member.role === 'owner' && <Crown className="size-3 text-amber-500" />}
        </Badge>
      ))}
    </div>
  )
}
