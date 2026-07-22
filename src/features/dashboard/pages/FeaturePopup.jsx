import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import './FeaturePopup.css'

const EMPTY_FORM = { judul: '', isi: '' }
const BATAS_BARU_MS = 60 * 60 * 1000 // simbol ⚠️ hilang otomatis 1 jam setelah dibuat

function formatTanggal(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

// Item dianggap "baru" jika backend menandai is_new DAN belum lewat 1 jam
// sejak dibuat. Setelah 1 jam, simbol ⚠️ hilang dengan sendirinya walau
// field is_new dari backend masih true (belum sempat diupdate server).
function isMasihBaru(item, now) {
  if (!item?.is_new) return false
  const dibuat = item.created_at ? new Date(item.created_at).getTime() : null
  if (!dibuat) return true
  return now - dibuat < BATAS_BARU_MS
}

/**
 * Popup CRUD generik dipakai untuk 2 fitur: Berita (isinya sama untuk semua
 * user) dan Catatan (privat, beda per user -- backend yang memfilter
 * otomatis berdasarkan token login, komponen ini tidak perlu tahu bedanya).
 *
 * Komponen ini merender tombol mengambang (FAB) sendiri, jadi cukup taruh
 * <FeaturePopup .../> sekali di root layout -- tidak perlu tombol trigger
 * terpisah di tempat lain.
 *
 * Props:
 * - open, onClose, onOpen: state buka/tutup tetap dikontrol oleh parent;
 *   FAB memanggil onOpen saat ditekan dalam keadaan tertutup.
 * - icon, title, subtitle
 * - api: { list(token), create(payload, token), update(id, payload, token), remove(id, token) }
 * - itemNoun: dipakai di teks-teks kecil, mis. "berita" / "catatan"
 * - fabOffset: indeks urutan (0, 1, 2...) supaya beberapa FAB dari beberapa
 *   instance FeaturePopup bisa ditumpuk vertikal tanpa saling menutupi.
 * - readOnly: kalau true, tombol Tambah/Edit/Hapus disembunyikan -- dipakai
 *   supaya Berita cuma bisa di-CRUD oleh admin, tapi tetap bisa dibaca semua
 *   user (mis. role "user" biasa membuka popup Berita hanya untuk melihat).
 */
export default function FeaturePopup({ open, onClose, onOpen, icon, title, subtitle, api, itemNoun, fabOffset = 0, readOnly = false }) {
  const { token } = useAuth()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [mode, setMode] = useState('list') // 'list' | 'form'
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Jam berjalan supaya badge ⚠️ ikut menghilang otomatis walau popup
  // dibiarkan terbuka lebih dari 1 jam (tanpa perlu reload data).
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!open) return
    setMode('list')
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const id = setInterval(() => setNow(Date.now()), 30 * 1000)
    return () => clearInterval(id)
  }, [open])

  // Muat data secara diam-diam walau popup tertutup, supaya lencana ⚠️ di
  // tombol mengambang tetap akurat sebelum pengguna sempat membuka popup.
  useEffect(() => {
    if (open) return
    let batal = false
    api.list(token)
      .then((data) => { if (!batal) setItems(data || []) })
      .catch(() => {})
    return () => { batal = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Ditampilkan pada tombol mengambang (FAB) walau popup tertutup, supaya
  // pengguna tahu ada berita baru tanpa harus membuka popup dulu.
  const adaBaru = items.some((item) => isMasihBaru(item, now))

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.list(token)
      setItems(data || [])
    } catch (e) {
      setError(e.message || 'Gagal memuat data.')
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    if (readOnly) return
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setFormError('')
    setMode('form')
  }

  function openEdit(item) {
    if (readOnly) return
    setEditingId(item.id)
    setFormData({ judul: item.judul, isi: item.isi })
    setFormError('')
    setMode('form')
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!formData.judul.trim() || !formData.isi.trim()) {
      setFormError('Judul dan isi wajib diisi.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      if (editingId) {
        await api.update(editingId, formData, token)
      } else {
        await api.create(formData, token)
      }
      setMode('list')
      await load()
    } catch (e) {
      setFormError(e.message || 'Gagal menyimpan.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (readOnly) return
    if (!window.confirm(`Hapus ${itemNoun} "${item.judul}"? Tindakan ini tidak bisa dibatalkan.`)) return
    setDeletingId(item.id)
    try {
      await api.remove(item.id, token)
      await load()
    } catch (e) {
      setError(e.message || 'Gagal menghapus.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <button
        type="button"
        className={`fp-fab${adaBaru ? ' fp-fab-alert' : ''}`}
        style={{ '--fp-fab-offset': fabOffset }}
        onClick={open ? onClose : onOpen}
        aria-label={adaBaru ? `${title} — ada ${itemNoun} baru` : title}
        aria-expanded={open}
      >
        <span className="fp-fab-icon">{icon}</span>
        {adaBaru && !open && (
          <span className="fp-fab-badge" aria-hidden="true">⚠️</span>
        )}
      </button>

      {open && (
        <div className="fp-backdrop" onClick={onClose}>
          <div className="fp-panel" onClick={(e) => e.stopPropagation()}>
            <div className="fp-header">
              <div className="fp-header-text">
                <span className="fp-icon">{icon}</span>
                <div>
                  <h2>{title}</h2>
                  <p>{subtitle}</p>
                </div>
              </div>
              <button type="button" className="fp-close" onClick={onClose} aria-label="Tutup">
                ✕
              </button>
            </div>

            {mode === 'list' && (
              <>
                {!readOnly && (
                  <button type="button" className="fp-add-btn" onClick={openAdd}>
                    + Tambah {itemNoun}
                  </button>
                )}

                {loading && <div className="fp-status">Memuat…</div>}
                {!loading && error && <div className="fp-status fp-error">{error}</div>}
                {!loading && !error && items.length === 0 && (
                  <div className="fp-status">Belum ada {itemNoun}.</div>
                )}

                {!loading && !error && items.length > 0 && (
                  <ul className="fp-list">
                    {items.map((item) => {
                      const baru = isMasihBaru(item, now)
                      return (
                        <li className={`fp-card${baru ? ' fp-card-new' : ''}`} key={item.id}>
                          <div className="fp-card-main">
                            <p className="fp-card-title">
                              {baru && (
                                <span className="fp-card-badge" aria-label={`${itemNoun} baru`}>
                                  ⚠️
                                </span>
                              )}
                              {item.judul}
                            </p>
                            <p className="fp-card-body">{item.isi}</p>
                            <span className="fp-card-date">
                              {formatTanggal(item.updated_at || item.created_at)}
                              {item.dibuat_oleh ? ` · ${item.dibuat_oleh}` : ''}
                            </span>
                          </div>
                          {!readOnly && (
                            <div className="fp-card-actions">
                              <button type="button" className="fp-edit-btn" onClick={() => openEdit(item)}>
                                Edit
                              </button>
                              <button
                                type="button"
                                className="fp-delete-btn"
                                onClick={() => handleDelete(item)}
                                disabled={deletingId === item.id}
                              >
                                {deletingId === item.id ? 'Menghapus…' : 'Hapus'}
                              </button>
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </>
            )}

            {mode === 'form' && (
              <form className="fp-form" onSubmit={handleSave}>
                <label className="fp-field">
                  <span>Judul</span>
                  <input
                    type="text"
                    value={formData.judul}
                    onChange={(e) => setFormData((f) => ({ ...f, judul: e.target.value }))}
                    placeholder={`Judul ${itemNoun}`}
                    autoFocus
                  />
                </label>
                <label className="fp-field">
                  <span>Isi</span>
                  <textarea
                    rows={6}
                    value={formData.isi}
                    onChange={(e) => setFormData((f) => ({ ...f, isi: e.target.value }))}
                    placeholder={`Tulis isi ${itemNoun} di sini...`}
                  />
                </label>

                {formError && <div className="fp-status fp-error">{formError}</div>}

                <div className="fp-form-actions">
                  <button type="button" className="fp-cancel-btn" onClick={() => setMode('list')}>
                    Batal
                  </button>
                  <button type="submit" className="fp-save-btn" disabled={saving}>
                    {saving ? 'Menyimpan…' : 'Simpan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
