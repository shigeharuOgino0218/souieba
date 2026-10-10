import { AppHeader } from '@/components/AppHeader'

/** 献立のタブ。中身は未設計なので、入口だけ用意して準備中と出す */
export default function MealsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <AppHeader title={<span className="px-2 text-lg font-bold">献立</span>} />
      <p className="px-4 py-16 text-center text-muted-foreground">
        献立は準備中です
      </p>
    </div>
  )
}
