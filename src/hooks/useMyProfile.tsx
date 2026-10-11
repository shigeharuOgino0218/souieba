import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Profile } from '@/lib/types'

type MyProfileContextValue = {
  profile: Profile | null
  loading: boolean
  refresh: () => Promise<void>
}

const MyProfileContext = createContext<MyProfileContextValue | null>(null)

/**
 * ログイン中のユーザーのプロフィールを、アプリ全体で1度だけ読み込んで共有する。
 * ヘッダーは画面ごとに描き直されるので、画面ごとに読み込むとタブを移るたびにアバターが読み込み中に戻る。
 * 読み込んだ結果はユーザー id と組で持ち、ログインし直して別のユーザーになったら読み終えるまで読み込み中として扱う。
 */
export function MyProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const userId = session?.user.id ?? null
  const [loaded, setLoaded] = useState<{
    userId: string
    profile: Profile | null
  } | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    setLoaded({ userId, profile: data })
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const current = loaded?.userId === userId ? loaded : null

  return (
    <MyProfileContext.Provider
      value={{
        profile: current?.profile ?? null,
        loading: !current,
        refresh,
      }}
    >
      {children}
    </MyProfileContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMyProfile() {
  const ctx = useContext(MyProfileContext)
  if (!ctx)
    throw new Error(
      'useMyProfile は MyProfileProvider の内側で使用してください',
    )
  return ctx
}
