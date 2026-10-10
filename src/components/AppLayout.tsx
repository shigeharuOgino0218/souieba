import { Outlet } from 'react-router-dom'
import { ActiveListProvider, ListsProvider, useLists } from '@/hooks/useLists'
import { BottomNav } from '@/components/BottomNav'
import { CreateListDrawer } from '@/components/CreateListDrawer'

/**
 * 買い物リスト・リピ買い・献立の3タブを包むレイアウト。リストの状態を共有し、画面下にボトムメニューを固定する。
 * 本文の下端はメニューに隠れないよう、メニューの高さ分だけ余白を取る。
 */
export function AppLayout() {
  return (
    <ListsProvider>
      <div className="pb-[calc(var(--bottom-nav-height)+1rem)]">
        <ActiveListProvider>
          <Outlet />
        </ActiveListProvider>
      </div>
      <BottomNav />
      <EmptyStateCreateListDrawer />
    </ListsProvider>
  )
}

/**
 * リストが0件のときの案内から開く作成ドロワー。
 * 作成するとリストが1件になり案内が消えるので、閉じるアニメーションを残すため案内の外に置く。
 */
function EmptyStateCreateListDrawer() {
  const { createOpen, setCreateOpen, handleCreated } = useLists()
  return (
    <CreateListDrawer
      open={createOpen}
      onOpenChange={setCreateOpen}
      onCreated={handleCreated}
    />
  )
}
