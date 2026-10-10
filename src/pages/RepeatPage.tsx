import { useLists } from '@/hooks/useLists'
import { RepeatBuyEditor } from '@/components/RepeatBuyEditor'
import {
  ListBodySkeleton,
  ListHeader,
  NoListsPlaceholder,
} from '@/components/ListHeader'

/** リピ買いのタブ。選択中のリストのリピ買いを選んで、まとめて買い物リストに登録する */
export default function RepeatPage() {
  const { loading, active } = useLists()

  return (
    <div className="mx-auto max-w-2xl">
      <ListHeader />
      {loading ? (
        <div className="px-4">
          <ListBodySkeleton />
        </div>
      ) : active ? (
        <div className="mt-2 px-4">
          {/* 選択と検索はリストごとのものなので、切り替えたら作り直して消す */}
          <RepeatBuyEditor key={active.id} />
        </div>
      ) : (
        <NoListsPlaceholder />
      )}
    </div>
  )
}
