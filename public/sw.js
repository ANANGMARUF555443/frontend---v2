// Service worker sederhana untuk PWA -- tanpa dependency tambahan.
//
// PENTING: setiap kali kamu deploy versi baru, naikkan angka di
// CACHE_VERSION supaya browser pengguna lama tahu harus ambil ulang
// file-file yang berubah (bukan pakai cache lama selamanya).
const CACHE_VERSION = 'v1'
const CACHE_NAME = `kamus-cache-${CACHE_VERSION}`

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('kamus-cache-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Cuma tangani GET, dan cuma untuk request ke origin sendiri.
  // Request ke backend API (origin lain) dibiarkan lewat langsung
  // supaya data (kosakata, login, dll) selalu fresh dan tidak ke-cache.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return
  }

  // Navigasi antar halaman (klik link, refresh, buka app dari home screen):
  // coba jaringan dulu, kalau offline baru pakai index.html dari cache
  // (biar client-side routing React Router tetap jalan saat offline).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone))
          return response
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Asset statis (JS, CSS, gambar, font, ikon): stale-while-revalidate --
  // langsung balas dari cache kalau ada (cepat), sambil diam-diam update
  // cache di background dari jaringan untuk kunjungan berikutnya.
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => cached)
      return cached || fetchPromise
    })
  )
})
  
