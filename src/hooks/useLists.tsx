/**
 * 買い物リスト・リピ買い・献立の3タブで共有する、リストの一覧と選択中のリストの状態。
 * タブを切り替えても読み込み直さず、どのタブでリストを切り替えても同じリストを指すよう、
 * タブの外側のレイアウトに置く。選択中のリストのアイテムとお店の購読もここで1つだけ持つ。
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useListData } from '@/hooks/useListData'
import {
  pickAfterRemoval,
  pickInitialListId,
  readRequestedListId,
} from '@/lib/lists'
import type { List } from '@/lib/types'

const LAST_LIST_KEY = 'souieba:lastListId'

type ListsContextValue = {
  lists: List[]
  loading: boolean
  active: List | null
  select: (id: string) => void
  handleCreated: (list: List) => void
  handleRenamed: (id: string, name: string) => void
  handleRemoved: (id: string) => void
  createOpen: boolean
  setCreateOpen: (open: boolean) => void
}

type ActiveListData = ReturnType<typeof useListData>

const ListsContext = createContext<ListsContextValue | null>(null)
const ActiveListContext = createContext<ActiveListData | null>(null)

export function ListsProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  // 通知や招待から来たときに開くリスト。マウント時の location.state だけを使い、以降の変化には追従しない
  const [requestedId] = useState(() => readRequestedListId(location.state))
  const active = lists.find((l) => l.id === activeId) ?? null

  // 再読み込みで指定のリストに戻されないよう、受け取った state は履歴から消す
  useEffect(() => {
    if (readRequestedListId(location.state)) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.state, location.pathname, navigate])

  // 指定されたリスト → 最後に編集していたリスト → 先頭の順で、最初に開くリストを決める
  useEffect(() => {
    supabase
      .from('lists')
      .select('*')
      .order('created_at')
      .then(({ data, error }) => {
        if (error) toast.error('リストの取得に失敗しました')
        const fetched = data ?? []
        const ids = fetched.map((l) => l.id)
        if (!error && requestedId && !ids.includes(requestedId)) {
          toast.error(
            'リストが見つかりません。削除されたか、アクセス権がない可能性があります。',
          )
        }
        setLists(fetched)
        setActiveId(
          pickInitialListId(
            ids,
            requestedId,
            localStorage.getItem(LAST_LIST_KEY),
          ),
        )
        setLoading(false)
      })
  }, [requestedId])

  useEffect(() => {
    if (activeId) localStorage.setItem(LAST_LIST_KEY, activeId)
  }, [activeId])

  const handleCreated = (list: List) => {
    setLists((prev) => [...prev, list])
    setActiveId(list.id)
    setCreateOpen(false)
  }

  const handleRenamed = (id: string, name: string) => {
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)))
  }

  // 削除・退会のどちらでもリストが手元から消えるので、選択中なら隣のリストに移す
  const handleRemoved = (id: string) => {
    if (localStorage.getItem(LAST_LIST_KEY) === id) {
      localStorage.removeItem(LAST_LIST_KEY)
    }
    setActiveId(
      pickAfterRemoval(
        lists.map((l) => l.id),
        id,
        activeId,
      ),
    )
    setLists((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <ListsContext
      value={{
        lists,
        loading,
        active,
        select: setActiveId,
        handleCreated,
        handleRenamed,
        handleRemoved,
        createOpen,
        setCreateOpen,
      }}
    >
      {children}
    </ListsContext>
  )
}

/**
 * リストが選ばれているあいだ、そのアイテムとお店を購読して useActiveListData に渡す。
 * リストが0件になったり作られたりすると中身が作り直されるので、本文だけを包み、
 * ボトムメニューや作成ドロワーはこの外に置く。
 */
export function ActiveListProvider({ children }: { children: ReactNode }) {
  const { active } = useLists()
  if (!active) return children
  return <ActiveListData listId={active.id}>{children}</ActiveListData>
}

// リストを切り替えても作り直さず、useListData が listId の変化に合わせて読み込み直す
function ActiveListData({
  listId,
  children,
}: {
  listId: string
  children: ReactNode
}) {
  const { session } = useAuth()
  const data = useListData(listId, session!.user.id)
  return <ActiveListContext value={data}>{children}</ActiveListContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLists() {
  const ctx = useContext(ListsContext)
  if (!ctx) throw new Error('useLists must be used within ListsProvider')
  return ctx
}

/** 選択中のリストのデータ。リストが選ばれている (useLists().active がある) ときだけ呼べる */
// eslint-disable-next-line react-refresh/only-export-components
export function useActiveListData() {
  const ctx = useContext(ActiveListContext)
  if (!ctx)
    throw new Error('useActiveListData must be used with an active list')
  return ctx
}
