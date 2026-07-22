// Endpoint kosakata (tabel `kosakata`, `tandai_kosakata`, `kosakata_tersembunyi`).
// Dipakai di KosakataAdmin dan di GlobalSearch (shared) untuk splitKosakata.
import { request } from '../../shared/lib/apiClient'

export const kosakataApi = {
  kosakataMeta: (token) => request('/admin/kosakata/meta', { token }),

  // `bab` biasanya selalu dikirim (satu bab per layar di Kosakata Admin);
  // `letak`/`search` opsional kalau butuh filter tambahan di server.
  listKosakata: (token, { bab, letak, search } = {}) => {
    const params = new URLSearchParams()
    if (bab !== undefined && bab !== null) params.set('bab', bab)
    if (letak) params.set('letak', letak)
    if (search) params.set('search', search)
    const qs = params.toString()
    return request(`/admin/kosakata${qs ? `?${qs}` : ''}`, { token })
  },

  createKosakata: (payload, token) =>
    request('/admin/kosakata', { method: 'POST', body: payload, token }),

  updateKosakata: (id, payload, token) =>
    request(`/admin/kosakata/${id}`, { method: 'PATCH', body: payload, token }),

  deleteKosakata: (id, token) =>
    request(`/admin/kosakata/${id}`, { method: 'DELETE', token }),

  // Impor banyak kosakata sekaligus dari kode SQL "INSERT INTO kosakata (...) VALUES (...), (...);"
  // default_bab/default_letak dipakai untuk baris yang tidak menyebut kolom bab/letak sendiri.
  bulkImportKosakataSql: (sqlText, { defaultBab, defaultLetak } = {}, token) =>
    request('/admin/kosakata/bulk-sql', {
      method: 'POST',
      body: {
        sql_text: sqlText,
        default_bab: defaultBab ?? null,
        default_letak: defaultLetak ?? null,
      },
      token,
    }),

  // Mesin pencari global: pecah satu kata/kalimat Korea jadi kata-kata dasar
  // (lewat korean_nlp.py/Kiwi di backend), lalu cari padanan tiap kata di
  // tabel kosakata. `bab` opsional -- kalau tidak diisi, dicari di semua bab.
  splitKosakata: (teks, token, bab = null) =>
    request('/kosakata/split', {
      method: 'POST',
      body: { teks, bab },
      token,
    }),

  // ── Tandai Kosakata / hafalan (privat per user) ────────────────
  // Bookmark kosakata yang mau ditandai/diulang lagi. `listTandaiKosakataIds`
  // dipakai buat status per kartu (ringan, cuma array id), `tandaiKosakataStats`
  // buat ringkasan "X/Y ditandai" (total, per bab, per letak).
  listTandaiKosakata: (token) => request('/tandai-kosakata', { token }),

  listTandaiKosakataIds: (token) => request('/tandai-kosakata/ids', { token }),

  tandaiKosakataStats: (token) => request('/tandai-kosakata/stats', { token }),

  tandaiKosakata: (kosakataId, token) =>
    request('/tandai-kosakata', { method: 'POST', body: { kosakata_id: kosakataId }, token }),

  hapusTandaiKosakata: (kosakataId, token) =>
    request(`/tandai-kosakata/${kosakataId}`, { method: 'DELETE', token }),

  // ── Sembunyikan Kosakata (privat per user) ─────────────────────
  // Kartu yang disembunyikan dianggap "tidak penting" oleh user dan TIDAK
  // ikut dihitung di stats hafalan (beda dengan tandaiKosakataStats yang
  // menghitung semua kosakata).
  listKosakataTersembunyi: (token) => request('/kosakata-tersembunyi', { token }),

  listKosakataTersembunyiIds: (token) => request('/kosakata-tersembunyi/ids', { token }),

  kosakataHafalanStats: (token) => request('/kosakata-tersembunyi/stats-hafalan', { token }),

  sembunyikanKosakata: (kosakataId, token) =>
    request('/kosakata-tersembunyi', { method: 'POST', body: { kosakata_id: kosakataId }, token }),

  batalkanSembunyikanKosakata: (kosakataId, token) =>
    request(`/kosakata-tersembunyi/${kosakataId}`, { method: 'DELETE', token }),
}
