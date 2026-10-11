import { useLists } from '@/hooks/useLists'
import { MealPlan } from '@/components/MealPlan'
import {
  ListBodySkeleton,
  ListHeader,
  NoListsPlaceholder,
} from '@/components/ListHeader'

/** 献立のタブ。選択中のリストのメンバーで共有する献立を、昨日から1週間先まで朝・昼・夜に分けて書く */
export default function MealsPage() {
  const { loading, active } = useLists()

  return (
    <div className="mx-auto max-w-2xl">
      <ListHeader />
      {loading ? (
        <div className="px-4">
          <ListBodySkeleton />
        </div>
      ) : active ? (
        <div className="px-4">
          {/* 入力の保存待ちと読み込み状態はリストごとのものなので、切り替えたら作り直す */}
          <MealPlan key={active.id} listId={active.id} />
        </div>
      ) : (
        <NoListsPlaceholder />
      )}
    </div>
  )
}
