import type { Database } from '@/lib/database.types'

type Tables = Database['public']['Tables']
type Functions = Database['public']['Functions']

export type Profile = Tables['profiles']['Row']
export type List = Tables['lists']['Row']
export type Store = Tables['stores']['Row']
export type Item = Tables['items']['Row']
export type ListMember = Tables['list_members']['Row']
export type InviteInfo = Functions['get_invite_info']['Returns'][number]
