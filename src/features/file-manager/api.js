// Endpoint file manager: penyimpanan mentah di Cloudflare R2 (listFiles,
// uploadAsset, createFolder, deleteFile/-Bulk/-Folder) + media library
// di database (tabel `files`, dipakai LibraryPicker buat pilih aset).
import { request, uploadRequest } from '../../shared/lib/apiClient'

export const fileManagerApi = {
  // ── Cloudflare R2 (file mentah) ─────────────────────────────────
  listFiles: (prefix, token) =>
    request(`/admin/files?prefix=${encodeURIComponent(prefix)}`, { token }),

  uploadAsset: (file, prefix, token, displayName = '') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('prefix', prefix)
    if (displayName) formData.append('display_name', displayName)
    return uploadRequest('/admin/files/upload', formData, token)
  },

  createFolder: (prefix, token) =>
    request('/admin/files/folder', { method: 'POST', body: { prefix }, token }),

  deleteFile: (key, token) =>
    request(`/admin/files?key=${encodeURIComponent(key)}`, { method: 'DELETE', token }),

  deleteFilesBulk: (keys, token) =>
    request('/admin/files/delete-bulk', { method: 'POST', body: { keys }, token }),

  deleteFolder: (prefix, token) =>
    request(`/admin/files/folder?prefix=${encodeURIComponent(prefix)}`, { method: 'DELETE', token }),

  // ── Media library (tabel `files` di database) ──────────────────
  listLibrary: (token, { category, folder, search } = {}) => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (folder !== undefined && folder !== null) params.set('folder', folder)
    if (search) params.set('search', search)
    const qs = params.toString()
    return request(`/admin/library${qs ? `?${qs}` : ''}`, { token })
  },

  // Struktur folder real-time dari Cloudinary, tiap file digabung dengan
  // display_name dari database (kalau sudah tercatat). Dipakai LibraryPicker.
  browseLibrary: (prefix, token) =>
    request(`/admin/library/browse?prefix=${encodeURIComponent(prefix)}`, { token }),

  registerLibraryFile: (fileData, token) =>
    request('/admin/library/register', { method: 'POST', body: fileData, token }),

  renameLibraryFile: (fileId, displayName, token) =>
    request(`/admin/library/${fileId}`, {
      method: 'PATCH',
      body: { display_name: displayName },
      token,
    }),

  deleteLibraryFile: (fileId, token) =>
    request(`/admin/library/${fileId}`, { method: 'DELETE', token }),

  syncLibrary: (token, prefix = '') =>
    request(`/admin/library/sync?prefix=${encodeURIComponent(prefix)}`, { method: 'POST', token }),
}
