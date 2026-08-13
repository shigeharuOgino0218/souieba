import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { usePushSubscription, type PushStatus } from '@/hooks/usePushSubscription'

const NOTES: Partial<Record<PushStatus, string>> = {
  'needs-install':
    'iPhone / iPad では、Safari の共有ボタンから「ホーム画面に追加」してアプリとして開くと通知を受け取れます。',
  denied: 'ブラウザの設定で通知がブロックされています。設定から許可してください。',
}

const DEFAULT_NOTE =
  '共有しているリストに他のメンバーがアイテムを追加したときに、この端末へ通知します。'

export function PushToggle() {
  const { status, busy, enable, disable } = usePushSubscription()

  if (status === 'unconfigured' || status === 'unsupported') return null

  const disabled =
    busy || status === 'loading' || status === 'needs-install' || status === 'denied'

  return (
    <div className="space-y-2">
      <div className="mb-3 flex items-center justify-between gap-4">
        <Label htmlFor="push">アイテム追加の通知</Label>
        <Switch
          id="push"
          checked={status === 'on'}
          disabled={disabled}
          onCheckedChange={(checked) => void (checked ? enable() : disable())}
        />
      </div>
      <p className="text-xs text-muted-foreground">{NOTES[status] ?? DEFAULT_NOTE}</p>
    </div>
  )
}
