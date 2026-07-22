// Endpoint buku (tabel `buku`, dipakai di halaman Buku Admin).
import { request } from '../../shared/lib/apiClient'

export const bukuApi = {
  bukuMeta: (token) => request('/admin/buku/meta', { token }),

  // `bab` biasanya selalu dikirim (satu bab per layar di halaman Buku).
  listBuku: (token, { bab } = {}) => {
    const params = new URLSearchParams()
    if (bab !== undefined && bab !== null) params.set('bab', bab)
    const qs = params.toString()
    return request(`/admin/buku${qs ? `?${qs}` : ''}`, { token })
  },

  createBuku: (payload, token) =>
    request('/admin/buku', { method: 'POST', body: payload, token }),

  updateBuku: (id, payload, token) =>
    request(`/admin/buku/${id}`, { method: 'PATCH', body: payload, token }),

  deleteBuku: (id, token) =>
    request(`/admin/buku/${id}`, { method: 'DELETE', token }),
}
