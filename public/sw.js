const CACHE_NAME = "campusrecover-v2"
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json", "/robots.txt"]

// Install Event: Cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn("[SW] Cache addAll warning:", err)
        })
      })
      .then(() => self.skipWaiting()),
  )
})

// Activate Event: Clear old cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// Fetch Event: Stale-While-Revalidate for images, Cache-First for static, Network-First for API
self.addEventListener("fetch", (event) => {
  const request = event.request
  const url = new URL(request.url)

  // Skip non-GET requests and chrome extensions
  if (request.method !== "GET" || !request.url.startsWith("http")) {
    return
  }

  // Cloudinary images & Dicebear avatars: Stale While Revalidate
  if (
    url.hostname.includes("cloudinary.com") ||
    url.hostname.includes("dicebear.com")
  ) {
    event.respondWith(caches.open("campusrecover-images").then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone())
              }
              return networkResponse
            })
            .catch(() => cachedResponse)

          return cachedResponse || fetchPromise
        })
      }))
    return
  }

  // Google Fonts: Cache First
  if (
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com")
  ) {
    event.respondWith(caches.open("campusrecover-fonts").then((cache) => {
        return cache.match(request).then((cached) => {
          if (cached) return cached
          return fetch(request).then((response) => {
            cache.put(request, response.clone())
            return response
          })
        })
      }))
    return
  }

  // App Navigation: Network First with Cache Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match("/index.html") || caches.match("/")
      }),
    )
    return
  }

  // Static Assets (JS, CSS, SVGs)
  event.respondWith(caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).then((response) => {
          if (
            response.status === 200 &&
            (url.pathname.endsWith(".js") || url.pathname.endsWith(".css"))
          ) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      )
    }))
})
