import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import { bukuApi } from '../api'
import { BAB_COUNT, HALAMAN_PER_BAB } from '../../../shared/constants/buku'
import LibraryPicker from '../../file-manager/components/LibraryPicker'
import '../../../shared/styles/Auth.css'
// Reuse tata letak admin dari fitur kosakata (class .ka-*) supaya tampilan konsisten.
import '../../kosakata/pages/KosakataAdmin.css'
import './BukuAdmin.css'

const PICKER_CATEGORY = { image_url: 'image', audio_url: 'audio', document_url: 'document' }

const EMPTY_FORM = {
  nomor_halaman: '1',
  image_url: '',
  audio_url: '',
  document_url: '',
}

// Selalu render 10 slot halaman (1..HALAMAN_PER_BAB) per bab, entah sudah
// ada datanya di database atau belum -- slot kosong tampil sebagai
// "+ Tambah" langsung di grid.
function buildSlots(items) {
  const byHalaman = {}
  for (const it of items) byHalaman[it.nomor_halaman] = it
  return Array.from({ length: HALAMAN_PER_BAB }, (_, i) => {
    const nomor = i + 1
    return byHalaman[nomor] || { nomor_halaman: nomor, _empty: true }
  })
}

export default function BukuAdmin() {
  const { token, user } = useAuth()

  // Hanya admin yang boleh tambah/edit/hapus halaman buku (endpoint backend
  // /admin/buku/* juga admin-only). Role "pro" & "user" biasa cuma bisa
  // lihat & baca (read-only).
  const canManage = user?.role === 'admin'

  const [bab, setBab] = useState(1)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ── Halaman yang lagi dipilih (untuk toolbar CRUD terpusat) ──────
  const [selectedHalaman, setSelectedHalaman] = useState(1)

  // ── Form tambah/edit ─────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add') // 'add' | 'edit'
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // ── Picker "pilih dari Library" ──────────────────────────────────
  const [pickerField, setPickerField] = useState(null)

  // ── Viewer fullscreen (tap gambar -> lightbox swipe kiri/kanan) ──
  const [viewerHalaman, setViewerHalaman] = useState(null) // nomor_halaman aktif, null = tertutup

  async function loadBab(babNumber) {
    setLoading(true)
    setError('')
    try {
      const data = await bukuApi.listBuku(token, { bab: babNumber })
      setItems(data)
    } catch (err) {
      setError(err.message || 'Gagal memuat halaman buku.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBab(bab)
    setSelectedHalaman(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bab])

  const slots = useMemo(() => buildSlots(items), [items])
  const selectedSlot = slots.find((s) => s.nomor_halaman === selectedHalaman) || slots[0]

  const audioItems = useMemo(
    () => slots.filter((s) => !s._empty && s.audio_url),
    [slots]
  )

  function openAddForm(nomorHalaman) {
    if (!canManage) return
    setFormMode('add')
    setEditingId(null)
    setFormData({ ...EMPTY_FORM, nomor_halaman: String(nomorHalaman) })
    setFormError('')
    setFormOpen(true)
  }

  function openEditForm(slot) {
    if (!canManage) return
    setFormMode('edit')
    setEditingId(slot.id)
    setFormData({
      nomor_halaman: String(slot.nomor_halaman),
      image_url: slot.image_url || '',
      audio_url: slot.audio_url || '',
      document_url: slot.document_url || '',
    })
    setFormError('')
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
    setFormError('')
  }

  function handleFormField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleFormSubmit(e) {
    e.preventDefault()
    if (!canManage) return
    const payload = {
      bab,
      nomor_halaman: Number(formData.nomor_halaman),
      image_url: formData.image_url.trim() || null,
      audio_url: formData.audio_url.trim() || null,
      document_url: formData.document_url.trim() || null,
    }

    setSaving(true)
    setFormError('')
    try {
      if (formMode === 'edit' && editingId) {
        await bukuApi.updateBuku(editingId, payload, token)
      } else {
        await bukuApi.createBuku(payload, token)
      }
      closeForm()
      setSelectedHalaman(payload.nomor_halaman)
      await loadBab(bab)
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan halaman buku.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(slot) {
    if (!canManage) return
    if (!slot || slot._empty) return
    if (
      !window.confirm(
        `Hapus Bab ${bab} Halaman ${slot.nomor_halaman}? Tindakan ini tidak bisa dibatalkan.`
      )
    )
      return
    setDeleting(true)
    setError('')
    try {
      await bukuApi.deleteBuku(slot.id, token)
      await loadBab(bab)
    } catch (err) {
      setError(err.message || 'Gagal menghapus halaman buku.')
    } finally {
      setDeleting(false)
    }
  }

  function openPicker(field) {
    setPickerField(field)
  }

  function closePicker() {
    setPickerField(null)
  }

  function selectPickerItem(url) {
    handleFormField(pickerField, url)
    closePicker()
  }

  function openViewer(nomorHalaman) {
    const slot = slots.find((s) => s.nomor_halaman === nomorHalaman)
    if (!slot || !slot.image_url) return
    setViewerHalaman(nomorHalaman)
  }

  function closeViewer() {
    setViewerHalaman(null)
  }

  function goViewer(delta) {
    setViewerHalaman((cur) => {
      if (cur === null) return cur
      let next = cur + delta
      // Cari slot bergambar berikutnya (lewati slot kosong)
      while (next >= 1 && next <= HALAMAN_PER_BAB) {
        const slot = slots.find((s) => s.nomor_halaman === next)
        if (slot && slot.image_url) return next
        next += delta
      }
      return cur
    })
  }

  const viewerSlot = slots.find((s) => s.nomor_halaman === viewerHalaman)

  return (
    <div className="ka-page ba-page">
      <Link className="back-link" to="/dashboard">&larr; Kembali ke Dashboard</Link>

      <div className="ka-header">
        <span className="ka-header-icon" aria-hidden="true">册</span>
        <div>
          <h1>Buku</h1>
          <p>{canManage ? 'Kelola halaman scan & audio per bab' : 'Halaman scan & audio per bab'}</p>
        </div>
      </div>

      <div className="ka-bab-nav">
        <button
          type="button"
          className="ka-bab-arrow"
          disabled={bab <= 1}
          onClick={() => setBab((b) => Math.max(1, b - 1))}
          aria-label="Bab sebelumnya"
        >
          &lsaquo;
        </button>
        <label className="ka-bab-select-wrap">
          <span className="ka-bab-select-label">BAB</span>
          <select
            className="ka-bab-select"
            value={bab}
            onChange={(e) => setBab(Number(e.target.value))}
          >
            {Array.from({ length: BAB_COUNT }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} / {BAB_COUNT}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="ka-bab-arrow"
          disabled={bab >= BAB_COUNT}
          onClick={() => setBab((b) => Math.min(BAB_COUNT, b + 1))}
          aria-label="Bab berikutnya"
        >
          &rsaquo;
        </button>
      </div>

      {error && <p className="auth-error">{error}</p>}

      {loading ? (
        <p className="ka-status">Memuat…</p>
      ) : (
        <>
          {/* ── Grid 5 kolom x 2 baris = 10 halaman ─────────────── */}
          <div className="ba-grid">
            {slots.map((slot) => (
              <button
                key={slot.nomor_halaman}
                type="button"
                className={`ba-thumb ${selectedHalaman === slot.nomor_halaman ? 'active' : ''} ${
                  slot._empty ? 'empty' : ''
                }`}
                onClick={() => {
                  setSelectedHalaman(slot.nomor_halaman)
                  if (!slot._empty && slot.image_url) openViewer(slot.nomor_halaman)
                }}
              >
                {slot._empty || !slot.image_url ? (
                  <span className="ba-thumb-empty-icon">{canManage ? '+' : '—'}</span>
                ) : (
                  <img src={slot.image_url} alt={`Bab ${bab} Halaman ${slot.nomor_halaman}`} loading="lazy" />
                )}
                {!slot._empty && slot.audio_url && (
                  <span className="ba-thumb-audio-dot" aria-hidden="true">♪</span>
                )}
                <span className="ba-thumb-num">{slot.nomor_halaman}</span>
              </button>
            ))}
          </div>

          {/* ── Toolbar CRUD terpusat untuk halaman terpilih (admin/pro saja) ── */}
          {canManage && (
            <div className="ba-toolbar">
              <span className="ba-toolbar-label">
                Halaman {selectedSlot?.nomor_halaman} dipilih
                {selectedSlot?._empty ? ' (kosong)' : ''}
              </span>
              <div className="ba-toolbar-actions">
                {selectedSlot?._empty ? (
                  <button
                    type="button"
                    className="ka-add-btn"
                    onClick={() => openAddForm(selectedSlot.nomor_halaman)}
                  >
                    + Tambah
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="ka-edit-btn ba-toolbar-btn"
                      onClick={() => openEditForm(selectedSlot)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="ka-delete-btn ba-toolbar-btn"
                      disabled={deleting}
                      onClick={() => handleDelete(selectedSlot)}
                    >
                      {deleting ? '…' : 'Hapus'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Player audio terpusat (opsi "keduanya": tombol play di
              tiap thumbnail via titik ♪ + player besar di sini) ──── */}
          {selectedSlot && !selectedSlot._empty && selectedSlot.audio_url && (
            <div className="ba-audio-player">
              <span className="ba-audio-label">
                ♪ Audio halaman {selectedSlot.nomor_halaman}
              </span>
              <audio controls src={selectedSlot.audio_url} />
            </div>
          )}

          {selectedSlot && !selectedSlot._empty && selectedSlot.document_url && (
            <a
              className="ba-doc-link"
              href={selectedSlot.document_url}
              target="_blank"
              rel="noreferrer"
            >
              文 Buka dokumen halaman {selectedSlot.nomor_halaman}
            </a>
          )}

          {audioItems.length === 0 && (
            <p className="ka-empty ba-hint">
              Ketuk salah satu kotak gambar untuk membuka layar penuh &amp; menggeser antar halaman.
            </p>
          )}
        </>
      )}

      {/* ── Modal tambah/edit ───────────────────────────────────── */}
      {formOpen && (
        <div className="ka-modal-backdrop" onClick={closeForm}>
          <div className="ka-modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              {formMode === 'add' ? 'Tambah Halaman' : 'Edit Halaman'} — Bab {bab}
            </h2>
            <form onSubmit={handleFormSubmit} className="ka-form">
              <label className="ka-field">
                <span>Nomor Halaman</span>
                <select
                  value={formData.nomor_halaman}
                  onChange={(e) => handleFormField('nomor_halaman', e.target.value)}
                >
                  {Array.from({ length: HALAMAN_PER_BAB }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>Halaman {n}</option>
                  ))}
                </select>
              </label>

              {(['image_url', 'audio_url', 'document_url']).map((field) => (
                <label className="ka-field" key={field}>
                  <span>
                    URL {field === 'image_url' ? 'Gambar' : field === 'audio_url' ? 'Audio' : 'Dokumen'}
                  </span>
                  <div className="ka-media-input-row">
                    <input
                      type="text"
                      value={formData[field]}
                      onChange={(e) => handleFormField(field, e.target.value)}
                      placeholder="https://…"
                    />
                    <button type="button" className="ka-pick-btn" onClick={() => openPicker(field)}>
                      Pilih
                    </button>
                  </div>
                  {field === 'image_url' && formData.image_url && (
                    <img className="ba-form-preview" src={formData.image_url} alt="Pratinjau" />
                  )}
                </label>
              ))}

              {formError && <p className="auth-error">{formError}</p>}

              <div className="ka-form-actions">
                <button type="button" className="ka-cancel-btn" onClick={closeForm}>
                  Batal
                </button>
                <button type="submit" className="ka-save-btn" disabled={saving}>
                  {saving ? 'Menyimpan…' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal picker "pilih dari Library" ──────────────────────── */}
      {pickerField && (
        <LibraryPicker
          category={PICKER_CATEGORY[pickerField]}
          token={token}
          onSelect={selectPickerItem}
          onClose={closePicker}
        />
      )}

      {/* ── Viewer fullscreen mobile: swipe / tombol kiri-kanan ─── */}
      {viewerHalaman !== null && viewerSlot && (
        <BukuViewer
          bab={bab}
          slot={viewerSlot}
          hasPrev={slots.some((s) => s.nomor_halaman < viewerHalaman && s.image_url)}
          hasNext={slots.some((s) => s.nomor_halaman > viewerHalaman && s.image_url)}
          onPrev={() => goViewer(-1)}
          onNext={() => goViewer(1)}
          onClose={closeViewer}
        />
      )}
    </div>
  )
}

function BukuViewer({ bab, slot, hasPrev, hasNext, onPrev, onNext, onClose }) {
  const viewerRef = useRef(null)
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 })
  const transformRef = useRef(transform)
  const gestureRef = useRef({
    mode: null, // 'pinch' | 'pan' | 'swipe'
    startX: 0,
    startY: 0,
    startDist: 0,
    startTransform: { scale: 1, x: 0, y: 0 },
    lastTapTime: 0,
    lastTapPos: { x: 0, y: 0 },
  })

  useEffect(() => {
    transformRef.current = transform
  }, [transform])

  // Reset zoom setiap ganti halaman
  useEffect(() => {
    setTransform({ scale: 1, x: 0, y: 0 })
  }, [slot.nomor_halaman])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onPrev()
      else if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, onPrev, onNext])

  // Pinch-zoom, double-tap-zoom & pan manual (native browser zoom sudah dimatikan
  // lewat viewport meta, jadi gesture ini yang menggantikan perannya khusus di viewer).
  useEffect(() => {
    const el = viewerRef.current
    if (!el) return

    const MAX_SCALE = 4
    const MIN_SCALE = 1

    function distance(touches) {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.hypot(dx, dy)
    }

    function clamp(scale, x, y) {
      const s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale))
      const maxOffset = s > 1 ? (s - 1) * 160 : 0
      return {
        scale: s,
        x: Math.max(-maxOffset, Math.min(maxOffset, x)),
        y: Math.max(-maxOffset, Math.min(maxOffset, y)),
      }
    }

    function onTouchStart(e) {
      const g = gestureRef.current
      const cur = transformRef.current

      if (e.touches.length === 2) {
        e.preventDefault()
        g.mode = 'pinch'
        g.startDist = distance(e.touches)
        g.startTransform = cur
        return
      }

      if (e.touches.length === 1) {
        const t = e.touches[0]

        // Deteksi double-tap
        const now = Date.now()
        const isDoubleTap =
          now - g.lastTapTime < 300 &&
          Math.abs(t.clientX - g.lastTapPos.x) < 30 &&
          Math.abs(t.clientY - g.lastTapPos.y) < 30
        g.lastTapTime = now
        g.lastTapPos = { x: t.clientX, y: t.clientY }

        if (isDoubleTap) {
          e.preventDefault()
          g.mode = 'doubletap'
          setTransform(cur.scale > 1.02 ? { scale: 1, x: 0, y: 0 } : { scale: 2.5, x: 0, y: 0 })
          g.lastTapTime = 0
          return
        }

        if (cur.scale > 1.02) {
          g.mode = 'pan'
          g.startX = t.clientX
          g.startY = t.clientY
          g.startTransform = cur
        } else {
          g.mode = 'swipe'
          g.startX = t.clientX
          g.startY = t.clientY
        }
      }
    }

    function onTouchMove(e) {
      const g = gestureRef.current

      if (g.mode === 'pinch' && e.touches.length === 2) {
        e.preventDefault()
        const dist = distance(e.touches)
        const rawScale = g.startTransform.scale * (dist / g.startDist)
        setTransform(clamp(rawScale, g.startTransform.x, g.startTransform.y))
      } else if (g.mode === 'pan' && e.touches.length === 1) {
        e.preventDefault()
        const t = e.touches[0]
        const dx = t.clientX - g.startX
        const dy = t.clientY - g.startY
        setTransform(clamp(g.startTransform.scale, g.startTransform.x + dx, g.startTransform.y + dy))
      }
      // mode 'swipe': biarkan, ditangani di touchend
    }

    function onTouchEnd(e) {
      const g = gestureRef.current
      if (g.mode === 'swipe') {
        const t = e.changedTouches[0]
        const dx = t.clientX - g.startX
        const dy = t.clientY - g.startY
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          if (dx < 0) onNext()
          else onPrev()
        }
      }
      g.mode = null
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [onNext, onPrev])

  function handleDoubleClick() {
    // Zoom pakai mouse (desktop): dobel klik toggle zoom
    setTransform((prev) => (prev.scale > 1.02 ? { scale: 1, x: 0, y: 0 } : { scale: 2.5, x: 0, y: 0 }))
  }

  return (
    <div className="ba-viewer" ref={viewerRef}>
      <button type="button" className="ba-viewer-close" onClick={onClose} aria-label="Tutup">
        ✕
      </button>

      <span className="ba-viewer-caption">
        Bab {bab} · Halaman {slot.nomor_halaman}
      </span>

      <button
        type="button"
        className="ba-viewer-nav ba-viewer-nav-left"
        onClick={onPrev}
        disabled={!hasPrev}
        aria-label="Halaman sebelumnya"
      >
        &lsaquo;
      </button>

      <div className="ba-viewer-image-wrap">
        <img
          src={slot.image_url}
          alt={`Bab ${bab} Halaman ${slot.nomor_halaman}`}
          onDoubleClick={handleDoubleClick}
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transition: transform.scale === 1 ? 'transform 0.15s ease' : 'none',
          }}
        />
      </div>

      <button
        type="button"
        className="ba-viewer-nav ba-viewer-nav-right"
        onClick={onNext}
        disabled={!hasNext}
        aria-label="Halaman berikutnya"
      >
        &rsaquo;
      </button>

      {slot.audio_url && (
        <div className="ba-viewer-audio">
          <audio controls src={slot.audio_url} />
        </div>
      )}
    </div>
  )
}
