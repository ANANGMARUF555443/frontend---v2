// Ganti URL di bawah ini dengan URL gambar (PNG/JPG/WEBP) yang mau dipakai
// sebagai background di seluruh halaman.
// Contoh: 'https://res.cloudinary.com/namaproject/image/upload/v123/bg.png'
export const BACKGROUND_IMAGE_URL = 'https://res.cloudinary.com/h6bwjyit/image/upload/v1784377903/a20o8r8m455kqoe7bh2q_tfipn6.webp'

// Warna solid fallback, tampil instan (lewat CSS) sebelum gambar selesai
// dimuat oleh browser, supaya tidak ada jeda blank/putih saat refresh.
export const BACKGROUND_FALLBACK_COLOR = '#0b0e1a'

// Opacity overlay gelap/terang tipis di atas gambar supaya teks tetap
// terbaca. 0 = tanpa overlay, 1 = solid.
export const BACKGROUND_OVERLAY_OPACITY = 0.35
export const BACKGROUND_OVERLAY_COLOR = '#0b0e1a'

// --- Pengaturan animasi PixiJS (lapisan tambahan di atas CSS background) ---

// Aktif/nonaktifkan lapisan animasi partikel di atas background.
export const BACKGROUND_ANIMATION_ENABLED = true

// Jumlah partikel melayang.
export const BACKGROUND_PARTICLE_COUNT = 40

// Warna partikel (hex).
export const BACKGROUND_PARTICLE_COLOR = '#ffffff'

// Opacity maksimum partikel.
export const BACKGROUND_PARTICLE_OPACITY = 0.25

// Kecepatan naik partikel (px per frame, kira-kira).
export const BACKGROUND_PARTICLE_SPEED = 0.4
