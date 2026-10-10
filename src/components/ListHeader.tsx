import { CirclePlus, EllipsisVertical, Share } from 'lucide-react'
import { useLists } from '@/hooks/useLists'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AppHeader } from '@/components/AppHeader'
import { InviteDrawer } from '@/components/InviteDrawer'
import { ListMenuDrawer } from '@/components/ListMenuDrawer'
import { ListSwitcherDrawer } from '@/components/ListSwitcherDrawer'

/**
 * 買い物リストとリピ買いのタブのヘッダー。見出しをリストの切り替えにし、そのすぐ右に選択中のリストの「共有」と「︙」を薄いピルでまとめる。
 * どちらのタブで切り替えても、選択中のリストは useLists を通じて共有される。
 */
export function ListHeader() {
  const {
    lists,
    loading,
    active,
    select,
    handleCreated,
    handleRenamed,
    handleRemoved,
  } = useLists()

  return (
    <AppHeader
      title={
        loading ? (
          <Skeleton className="ml-2 h-6 w-40" />
        ) : (
          <ListSwitcherDrawer
            lists={lists}
            activeId={active?.id ?? null}
            onSelect={select}
            onCreated={handleCreated}
          />
        )
      }
      actions={
        active && (
          <div className="flex items-center rounded-full bg-muted/50 p-0.5">
            <InviteDrawer
              listId={active.id}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${active.name}を共有`}
                />
              }
            >
              <Share />
            </InviteDrawer>
            <ListMenuDrawer
              list={active}
              onRenamed={(name) => handleRenamed(active.id, name)}
              onRemoved={() => handleRemoved(active.id)}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${active.name}のメニュー`}
                />
              }
            >
              <EllipsisVertical />
            </ListMenuDrawer>
          </div>
        )
      }
    />
  )
}

/** リストが1件も無いときの案内。リストに属するリピ買いのタブでも同じものを出す */
export function NoListsPlaceholder() {
  const { setCreateOpen } = useLists()
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
      <p className="text-muted-foreground">買い物リストがありません</p>
      <Button onClick={() => setCreateOpen(true)}>
        <CirclePlus data-icon="inline-start" />
        買い物リストを追加
      </Button>
    </div>
  )
}

/** リストの読み込み中に、本文の場所に出す仮の行 */
export function ListBodySkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  )
}
