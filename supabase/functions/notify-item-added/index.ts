import * as webpush from 'jsr:@negrel/webpush@^0.5.0'
import { createClient } from 'jsr:@supabase/supabase-js@^2.112.0'

const SHARED_SECRET = Deno.env.get('NOTIFY_SHARED_SECRET') ?? ''
// クライアントの 500ms デバウンスは入力途中でも保存するため、確定を待ってから名前を読む
const DELAY_MS = Number(Deno.env.get('NOTIFY_DELAY_MS') ?? 1500)
const WINDOW_SEC = Number(Deno.env.get('NOTIFY_WINDOW_SEC') ?? 90)
const EVENT_RETENTION_MS = 24 * 60 * 60 * 1000

const vapidKeys = await webpush.importVapidKeys(
  JSON.parse(Deno.env.get('VAPID_KEYS') ?? '{}'),
  { extractable: false },
)
const appServer = await webpush.ApplicationServer.new({
  contactInformation: Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com',
  vapidKeys,
})

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

type PushEventRow = {
  item_id: string
  created_at: string
  item: { name: string } | { name: string }[] | null
}

function itemName(row: PushEventRow): string {
  const item = Array.isArray(row.item) ? row.item[0] : row.item
  return item?.name?.trim() ?? ''
}

function buildBody(actor: string, names: string[]): string {
  if (names.length === 0) return `${actor}さんがアイテムを追加しました`
  if (names.length === 1) return `${actor}さんが「${names[0]}」を追加しました`
  const head = names.slice(0, 2).join('、')
  const rest = names.length > 2 ? ` ほか${names.length - 2}件` : ''
  return `${actor}さんが${names.length}件追加しました（${head}${rest}）`
}

// DELAY_MS が長いと呼び出し元(pg_net)がタイムアウトするので、応答は即返して裏で送る
function runInBackground(task: Promise<unknown>) {
  const runtime = (globalThis as {
    EdgeRuntime?: { waitUntil(promise: Promise<unknown>): void }
  }).EdgeRuntime
  if (runtime) runtime.waitUntil(task)
  else void task
}

async function notify(listId: string, actorId: string) {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS))

  const since = new Date(Date.now() - WINDOW_SEC * 1000).toISOString()
  const [listRes, actorRes, membersRes, eventsRes] = await Promise.all([
    admin.from('lists').select('name').eq('id', listId).maybeSingle(),
    admin.from('profiles').select('display_name').eq('id', actorId).maybeSingle(),
    admin.from('list_members').select('user_id').eq('list_id', listId).neq('user_id', actorId),
    admin
      .from('push_events')
      .select('item_id, created_at, item:items(name)')
      .eq('list_id', listId)
      .eq('actor_id', actorId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const userIds = (membersRes.data ?? []).map((m) => m.user_id)
  if (userIds.length === 0) return

  const seen = new Set<string>()
  const names: string[] = []
  for (const row of ((eventsRes.data ?? []) as PushEventRow[]).reverse()) {
    const name = itemName(row)
    if (name && !seen.has(row.item_id)) {
      seen.add(row.item_id)
      names.push(name)
    }
  }

  const payload = JSON.stringify({
    title: listRes.data?.name ?? 'SOUIEBA!',
    body: buildBody(actorRes.data?.display_name?.trim() || '誰か', names),
    tag: `list-${listId}`,
    url: `/lists/${listId}`,
  })

  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('user_id', userIds)

  const gone: string[] = []
  await Promise.all(
    (subs ?? []).map(async (sub) => {
      try {
        await appServer
          .subscribe({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } })
          .pushTextMessage(payload, {
            ttl: 3600,
            urgency: webpush.Urgency.Normal,
            // 未配信のメッセージも Push サービス側で同じリストの最新1件に畳ませる
            topic: String(listId).replaceAll('-', '').slice(0, 32),
          })
      } catch (err) {
        const status = err instanceof webpush.PushMessageError ? err.response.status : 0
        if (status === 404 || status === 410) gone.push(sub.endpoint)
        else console.error('push failed', sub.endpoint, String(err))
      }
    }),
  )

  if (gone.length > 0) {
    await admin.from('push_subscriptions').delete().in('endpoint', gone)
  }
  await admin
    .from('push_events')
    .delete()
    .lt('created_at', new Date(Date.now() - EVENT_RETENTION_MS).toISOString())

  console.log('notified', {
    listId,
    sent: (subs?.length ?? 0) - gone.length,
    items: names.length,
    gone: gone.length,
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 })
  if (!SHARED_SECRET || req.headers.get('x-notify-secret') !== SHARED_SECRET) {
    return new Response('forbidden', { status: 403 })
  }

  const { list_id: listId, actor_id: actorId } = await req.json().catch(() => ({}))
  if (!listId || !actorId) return new Response('bad request', { status: 400 })

  runInBackground(
    notify(listId, actorId).catch((err) => console.error('notify failed', String(err))),
  )
  return Response.json({ accepted: true }, { status: 202 })
})
