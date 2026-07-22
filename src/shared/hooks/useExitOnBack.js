import { useEffect } from 'react'

/**
 * useExitOnBack
 * ---------------------------------------------------------------
 * Dipasang di halaman yang dianggap "halaman utama" (Dashboard).
 * Tujuannya: walaupun history browser sudah panjang (user sempat
 * buka banyak halaman lain sebelum balik ke Dashboard), SEKALI
 * swipe-back / tekan tombol back harus langsung keluar dari
 * aplikasi/website -- bukan mundur satu-satu ke halaman sebelumnya,
 * dan BUKAN logout (logout tetap lewat tombol "Keluar" saja).
 *
 * Cara kerja:
 * 1. Saat halaman ini aktif, kita dorong satu entry "penjaga" ke
 *    history (pushState). Jadi urutan history jadi:
 *      [...halaman lama...] -> Dashboard -> (penjaga)
 * 2. Begitu user swipe-back / tekan back, browser memicu event
 *    'popstate' -- itu artinya browser baru saja mundur dari entry
 *    penjaga tadi, balik ke entry Dashboard yang asli.
 * 3. Di titik itu kita TIDAK membiarkan browser lanjut mundur ke
 *    halaman-halaman lama. Kita langsung coba tutup aplikasi:
 *      - window.close() -- berhasil kalau app dibuka sebagai PWA
 *        standalone (di-"Add to Home Screen") atau tab yang dibuka
 *        lewat window.open(); ini kondisi utama yang kita target
 *        karena manifest project ini "display": "standalone".
 *    - Kalau window.close() tidak diizinkan browser (mis. dibuka
 *      manual sebagai tab biasa, bukan lewat ikon PWA), sebagai
 *      fallback aman kita dorong lagi entry penjaga supaya user
 *      tetap "mentok" di Dashboard alih-alih kebawa mundur ke
 *      riwayat halaman lama. Tidak ada efek samping ke status
 *      login/akun sama sekali.
 */
export default function useExitOnBack(enabled = true) {
  useEffect(() => {
    if (!enabled) return

    // Pasang satu entry penjaga di atas entry Dashboard saat ini.
    // Ini membuat Dashboard jadi "dasar" -- satu langkah back akan
    // menyentuh penjaga ini duluan, bukan langsung ke halaman lama.
    window.history.pushState({ __exitGuard: true }, '', window.location.href)

    function handlePopState() {
      // User baru saja swipe-back / tekan tombol back sekali.
      // Coba tutup aplikasi/website (bukan logout, bukan ganti route).
      window.close()

      // Kalau baris di atas tidak menutup apa pun (browser menolak
      // window.close() karena tab dibuka manual, bukan via PWA/
      // window.open), kita cegah user "bocor" ke halaman-halaman
      // lama dengan mendorong penjaga baru lagi. Hasil akhirnya:
      // user tetap di Dashboard, tidak mundur ke riwayat lama.
      window.history.pushState({ __exitGuard: true }, '', window.location.href)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [enabled])
}
