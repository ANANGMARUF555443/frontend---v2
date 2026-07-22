// Endpoint dashboard: berita (pengumuman, sama untuk semua user) &
// catatan (catatan pribadi, privat per user). Dipakai lewat FeaturePopup.
import { request } from '../../shared/lib/apiClient'

export const dashboardApi = {
  // ── Berita ────────────────────────────────────────────────────
  listBerita: (token) => request('/berita', { token }),

  createBerita: (payload, token) =>
    request('/berita', { method: 'POST', body: payload, token }),

  updateBerita: (id, payload, token) =>
    request(`/berita/${id}`, { method: 'PATCH', body: payload, token }),

  deleteBerita: (id, token) =>
    request(`/berita/${id}`, { method: 'DELETE', token }),

  // ── Catatan ───────────────────────────────────────────────────
  listCatatan: (token) => request('/catatan', { token }),

  createCatatan: (payload, token) =>
    request('/catatan', { method: 'POST', body: payload, token }),

  updateCatatan: (id, payload, token) =>
    request(`/catatan/${id}`, { method: 'PATCH', body: payload, token }),

  deleteCatatan: (id, token) =>
    request(`/catatan/${id}`, { method: 'DELETE', token }),
}
