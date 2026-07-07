export type Profile = {
  id: string
  display_name: string
  avatar_icon: string
  avatar_color: string
  created_at: string
}

export type List = {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export type Store = {
  id: string
  list_id: string
  name: string
  created_at: string
}

export type Item = {
  id: string
  list_id: string
  name: string
  checked: boolean
  store_id: string | null
  position: number
  created_by: string | null
  created_at: string
}

export type InviteInfo = {
  list_id: string
  list_name: string
  expired: boolean
}
