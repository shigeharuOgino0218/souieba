import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  VAPID_PUBLIC_KEY,
  isIos,
  isPushSupported,
  isStandalone,
  matchesVapidKey,
  swReady,
  unsubscribePush,
  urlBase64ToUint8Array,
} from '@/lib/push'

export type PushStatus =
  | 'loading'
  | 'unconfigured'
  | 'unsupported'
  | 'needs-install'
  | 'denied'
  | 'off'
  | 'on'

function unavailableStatus(): PushStatus | null {
  if (!VAPID_PUBLIC_KEY) return 'unconfigured'
  // iOS Safari のタブでは window.Notification 自体が無いので standalone 判定を先に行う
  if (isIos() && !isStandalone()) return 'needs-install'
  if (!isPushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  return null
}

async function saveSubscription(subscription: PushSubscription) {
  const json = subscription.toJSON()
  return supabase.rpc('save_push_subscription', {
    _endpoint: subscription.endpoint,
    _p256dh: json.keys?.p256dh ?? '',
    _auth: json.keys?.auth ?? '',
    _user_agent: navigator.userAgent,
  })
}

export function usePushSubscription() {
  const { session } = useAuth()
  const [status, setStatus] = useState<PushStatus>('loading')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!session) return
    let cancelled = false

    const load = async () => {
      const unavailable = unavailableStatus()
      if (unavailable) {
        setStatus(unavailable)
        return
      }
      const registration = await swReady()
      const subscription = await registration?.pushManager.getSubscription()
      if (cancelled) return
      if (!subscription) {
        setStatus('off')
        return
      }
      // endpoint はブラウザ側で入れ替わることがあるので開くたびに保存し直す
      await saveSubscription(subscription)
      if (!cancelled) setStatus('on')
    }
    void load()

    return () => {
      cancelled = true
    }
  }, [session])

  const enable = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) return
    setBusy(true)
    try {
      // iOS ではユーザー操作の直後に呼ぶ必要があるため、他の await より先に権限を要求する
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'off')
        return
      }

      const registration = await swReady()
      if (!registration) {
        toast.error('通知の準備ができませんでした')
        return
      }

      let subscription = await registration.pushManager.getSubscription()
      if (subscription && !matchesVapidKey(subscription, VAPID_PUBLIC_KEY)) {
        await subscription.unsubscribe()
        subscription = null
      }
      subscription ??= await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const { error } = await saveSubscription(subscription)
      if (error) {
        toast.error('通知の設定に失敗しました')
        return
      }
      setStatus('on')
      toast.success('通知をオンにしました')
    } catch {
      toast.error('通知の設定に失敗しました')
    } finally {
      setBusy(false)
    }
  }, [])

  const disable = useCallback(async () => {
    setBusy(true)
    try {
      await unsubscribePush()
      setStatus('off')
      toast.success('通知をオフにしました')
    } catch {
      toast.error('通知の解除に失敗しました')
    } finally {
      setBusy(false)
    }
  }, [])

  return { status, busy, enable, disable }
}
