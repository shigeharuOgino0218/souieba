/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision: string | null }>
}

// registerType: 'autoUpdate' の自動付与は generateSW 専用なので injectManifest では自前で書く
self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))
registerRoute(
  /\.woff2?$/,
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  }),
  'GET',
)

type PushPayload = {
  title: string
  body: string
  tag: string
  url: string
}

// リストは HomePage にタブで並び(/lists/:id もここへリダイレクトされる)、どのリストの通知でもルートを開いていれば見ている扱いにする
async function isViewingLists(): Promise<boolean> {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  })
  return clients.some(
    (client) =>
      client.visibilityState === 'visible' &&
      new URL(client.url).pathname === '/',
  )
}

self.addEventListener('push', (event) => {
  const data = event.data
  if (!data) return

  let payload: PushPayload
  try {
    payload = data.json()
  } catch {
    payload = { title: 'SOUIEBA!', body: data.text(), tag: 'souieba', url: '/' }
  }

  event.waitUntil(
    (async () => {
      // userVisibleOnly の制約上ここで握りつぶすと購読を切られるため、必ず通知は出す
      const silent = await isViewingLists()
      await self.registration.showNotification(payload.title, {
        body: payload.body,
        tag: payload.tag,
        silent,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: { url: payload.url },
      })
    })(),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url =
    (event.notification.data as { url?: string } | undefined)?.url ?? '/'
  const target = new URL(url, self.location.origin).href

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      const client = clients[0]
      if (client) {
        await client.focus()
        // client.navigate() は iOS の standalone で不安定なのでアプリ側のルーターに任せる
        if (client.url !== target) client.postMessage({ type: 'navigate', url })
        return
      }
      await self.clients.openWindow(target)
    })(),
  )
})
