// Klien HTTP inti yang dipakai semua modul api.js di tiap fitur.
// Base URL backend diambil dari environment variable Vercel.
// Saat development lokal, isi di file .env: VITE_API_URL=http://127.0.0.1:8000
export const API_URL = import.meta.env.VITE_API_URL

export async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message = data?.detail || 'Terjadi kesalahan. Coba lagi.'
    throw new Error(typeof message === 'string' ? message : 'Terjadi kesalahan. Coba lagi.')
  }

  return data
}

// Upload file pakai FormData (bukan JSON), dipakai fitur file-manager/library.
export async function uploadRequest(path, formData, token) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = data?.detail || 'Gagal mengunggah file.'
    throw new Error(typeof message === 'string' ? message : 'Gagal mengunggah file.')
  }
  return data
}
