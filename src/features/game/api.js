// Endpoint game (tabel `game_setting_hafalan`, `game_acak_kata` + detail).
import { request } from '../../shared/lib/apiClient'

export const gameApi = {
  // ── Setting Hafalan (global) ───────────────────────────────────
  // 2 mode tetap: "contoh" (latihan singkat) & "acak" (pilih sendiri
  // kosakatanya). Jumlah soal & durasi cuma bisa diubah admin.
  listGameSettingHafalan: (token) => request('/game/setting-hafalan', { token }),

  updateGameSettingHafalan: (id, payload, token) =>
    request(`/admin/game/setting-hafalan/${id}`, { method: 'PATCH', body: payload, token }),

  // ── Acak Kata (privat per user) ────────────────────────────────
  // Alur: buat sesi (setting+bab+letak) -> user pilih kosakata di
  // FRONTEND saja (state lokal, tanpa API call per klik) -> mulai
  // (kirim semua kosakata_ids sekaligus) -> jawab tiap soal -> selesai
  // (poin otomatis digabung ke users.poin).
  listGameAcakKata: (token) => request('/game/acak-kata', { token }),

  detailGameAcakKata: (sesiId, token) => request(`/game/acak-kata/${sesiId}`, { token }),

  buatGameAcakKata: ({ idSettingGame, bab, letak }, token) =>
    request('/game/acak-kata', {
      method: 'POST',
      body: { id_setting_game: idSettingGame, bab, letak },
      token,
    }),

  mulaiGameAcakKata: (sesiId, kosakataIds, token) =>
    request(`/game/acak-kata/${sesiId}/mulai`, {
      method: 'POST',
      body: { kosakata_ids: kosakataIds },
      token,
    }),

  jawabSoalAcakKata: (sesiId, kosakataId, benar, token) =>
    request(`/game/acak-kata/${sesiId}/jawab`, {
      method: 'POST',
      body: { kosakata_id: kosakataId, benar },
      token,
    }),

  selesaikanGameAcakKata: (sesiId, token) =>
    request(`/game/acak-kata/${sesiId}/selesai`, { method: 'POST', token }),
}
