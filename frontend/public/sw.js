/* AK Pharma service worker: static assets only. */
const CACHE_PREFIX = "ak-pharma"
const CACHE_VERSION = "v1"
const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`
const OFFLINE_URL = "/offline.html"
const PRECACHE_URLS = [OFFLINE_URL]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith(`${CACHE_PREFIX}-`) && key !== STATIC_CACHE
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response && response.ok && response.type === "basic") {
    cache.put(request, response.clone())
  }
  return response
}

self.addEventListener("fetch", (event) => {
  const request = event.request

  // Only GET requests are eligible for any handling.
  if (request.method !== "GET") return

  const url = new URL(request.url)

  // Never touch cross-origin requests.
  if (url.origin !== self.location.origin) return

  // Navigations are network-only; the offline page is the fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(() =>
        caches.match(OFFLINE_URL)
      )
    )
    return
  }

  // Never cache API calls, RSC payloads, or authenticated HTML.
  if (url.pathname.startsWith("/api/")) return

  // Cache-first only for Next.js build assets and PWA icons.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(cacheFirst(request))
  }
})
