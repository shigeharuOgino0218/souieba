import { useCallback, useEffect, useId, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ListMember } from '@/lib/types'

export type Member = {
  user_id: string
  role: ListMember['role']
  display_name: string
  avatar_icon: string | null
  avatar_color: string | null
}

/**
 * リストのメンバーをプロフィール付きで取得し、参加・退会を Realtime で追従する。
 * 同じリストのタブとメンバードロワーが同時にマウントされるため、チャンネル名に useId を混ぜて分ける。
 * supabase.channel() は同じ名前だと既存のチャンネルを返し、購読済みのチャンネルに .on() すると例外になる。
 */
export function useListMembers(listId: string) {
  const instanceId = useId()
  const [members, setMembers] = useState<Member[]>([])

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('list_members')
      .select(
        'user_id, role, profiles(display_name, avatar_icon, avatar_color)',
      )
      .eq('list_id', listId)
      .order('created_at')
    setMembers(
      (data ?? []).map((row) => ({
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
      .channel(`members-${listId}-${instanceId}`)
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
  }, [listId, instanceId, load])

  return members
}
