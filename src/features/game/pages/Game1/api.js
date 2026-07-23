// Endpoint Game 1 (quiz kosakata Korea<->Indonesia). Semua route ada di
// bawah prefix /game1/... (lihat backend app/game/game1/router.py).
import { request } from '../../../../shared/lib/apiClient'

export const game1Api = {
  // Referensi pilihan tetap (dropdown jumlah soal, mode waktu, dll) untuk
  // membangun UI setting -- dipanggil sekali saat halaman setup dibuka.
  meta: (token) => request('/game1/meta', { token }),

  // ── Preset setting (privat per user, bisa disimpan & dipakai ulang) ──
  listSetting: (token) => request('/game1/setting', { token }),

  createSetting: (payload, token) =>
    request('/game1/setting', { method: 'POST', body: payload, token }),

  updateSetting: (id, payload, token) =>
    request(`/game1/setting/${id}`, { method: 'PATCH', body: payload, token }),

  deleteSetting: (id, token) =>
    request(`/game1/setting/${id}`, { method: 'DELETE', token }),

  // Cek berapa kosakata yang tersedia untuk kombinasi jenis_game + filter
  // yang dipilih -- dipakai untuk menonaktifkan pilihan jumlah_soal yang
  // melebihi ketersediaan, sebelum user menekan "Mulai".
  cekKetersediaan: (payload, token) =>
    request('/game1/cek-ketersediaan', { method: 'POST', body: payload, token }),

  // Mulai sesi baru: generate semua soal + opsi jawaban sekaligus.
  // payload bisa berisi id_setting_game1 (pakai preset) ATAU field-field
  // ad-hoc (jumlah_soal, mode_waktu, level_pilihan_ganda, tipe_soal,
  // jenis_game) + bab_dipilih/letak_ditandai/id_kosakata_ditandai sesuai
  // jenis_game yang dipilih.
  mulai: (payload, token) =>
    request('/game1/mulai', { method: 'POST', body: payload, token }),

  // Submit semua jawaban sekaligus di akhir sesi (bukan per-soal).
  submit: (sesiId, semuaJawaban, token) =>
    request(`/game1/${sesiId}/submit`, {
      method: 'POST',
      body: { semua_jawaban: semuaJawaban },
      token,
    }),

  riwayat: (token) => request('/game1/riwayat', { token }),
}
