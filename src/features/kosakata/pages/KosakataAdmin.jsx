import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import { kosakataApi } from '../api'
import { LETAK_LIST, BAB_COUNT } from '../../../shared/constants/letak'
import LibraryPicker from '../../file-manager/components/LibraryPicker'
import '../../../shared/styles/Auth.css'
import './KosakataAdmin.css'

const PICKER_CATEGORY = { image_url: 'image', audio_url: 'audio', document_url: 'document' }
const MEDIA_ICON = { image_url: '圖', audio_url: '音', document_url: '文' }

const EMPTY_FORM = {
  bab: '1',
  letak: 'judul',
  korean_text: '',
  english_text: '',
  indonesian_text: '',
  key_point: '',
  image_url: '',
  audio_url: '',
  document_url: '',
  order_index: '0',
}

export default function KosakataAdmin() {
  const { token, user } = useAuth()

  // Hanya admin yang boleh tambah/edit/hapus/impor SQL (endpoint backend
  // /admin/kosakata/* juga admin-only). Role "pro" & "user" biasa cuma
  // bisa lihat & cari (read-only).
  const canManage = user?.role === 'admin'

  // ── Bab (1..60) & letak (19 bagian tetap) yang lagi dibuka ──────
  const [bab, setBab] = useState(1)
  const [letak, setLetak] = useState(LETAK_LIST[0].key)

  // ── Semua kosakata pada bab yang lagi dibuka (dikelompokkan per letak
  //    di sisi client supaya pindah tab tidak perlu request baru) ──
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')

  // ── Tanda hafalan (bookmark privat milik user, tabel `tandai_kosakata`) ──
  // markedIds: id kosakata yang sudah ditandai user -- dipakai buat status
  // per kartu (★/☆). hafalanStats: ringkasan dari /kosakata-tersembunyi/stats-hafalan
  // (total keseluruhan + breakdown per bab, SUDAH mengecualikan kartu yang
  // disembunyikan) buat panel info di bawah nav bab.
  const [markedIds, setMarkedIds] = useState(() => new Set())
  const [markingId, setMarkingId] = useState(null) // id kosakata yg lagi diproses tandai/batal
  const [hafalanStats, setHafalanStats] = useState(null)
  const [hafalanLoading, setHafalanLoading] = useState(true)

  // ── Sembunyikan kosakata (privat milik user, tabel `kosakata_tersembunyi`) ──
  // hiddenIds: id kosakata yang disembunyikan user karena dianggap tidak
  // penting -- kartu ini tetap dirender tapi diciutkan jadi satu baris
  // ringkas dengan tombol "Tampilkan", dan tidak ikut dihitung di
  // hafalanStats maupun di penomoran urut kartu (numberById).
  const [hiddenIds, setHiddenIds] = useState(() => new Set())
  const [hidingId, setHidingId] = useState(null) // id kosakata yg lagi diproses sembunyikan/batal

  // ── Modal "Kotak Sampah" (🚮): menampilkan semua kosakata yang
  // disembunyikan pada bab yang lagi dibuka, dikelompokkan per letak.
  const [trashOpen, setTrashOpen] = useState(false)

  // ── Mode tampilan kartu (toggle lewat tombol titik tiga di toolbar) ──
  // 'all'          = tampilkan semua (Korea + Inggris + Indonesia + poin)
  // 'korean_only'  = sembunyikan semua selain teks Korea
  // 'indo_only'    = hanya tampilkan teks Indonesia
  const [viewMode, setViewMode] = useState('all')
  const [viewMenuOpen, setViewMenuOpen] = useState(false)

  // ── Override tampilan per kartu (per item kosakata) ──────────────
  // Map: { [itemId]: 'korean_only' | 'indo_only' | 'translation' }
  // Arti nilai tergantung viewMode global saat itu:
  //   - saat viewMode === 'all': nilai valid 'korean_only' / 'indo_only'
  //   - saat viewMode !== 'all': nilai valid 'translation' (tampilkan semua)
  // Item yang tidak ada di map ini berarti ikut mode global apa adanya.
  const [cardOverride, setCardOverride] = useState({})

  // ── Form tambah/edit ─────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add') // 'add' | 'edit'
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // ── Picker "pilih dari Library" untuk field gambar/audio/dokumen ──
  const [pickerField, setPickerField] = useState(null)

  // ── Impor via SQL (tambah banyak kosakata sekaligus) ─────────────
  // bab & letak SELALU mengikuti tab yang sedang dibuka (lihat `bab`,
  // `letak` di atas) -- tidak ada lagi opsi untuk mematikannya, jadi
  // kode SQL yang ditempel admin tidak perlu menyebut kolom bab/letak.
  const [sqlOpen, setSqlOpen] = useState(false)
  const [sqlText, setSqlText] = useState('')
  const [sqlSaving, setSqlSaving] = useState(false)
  const [sqlError, setSqlError] = useState('')
  const [sqlResultCount, setSqlResultCount] = useState(null)

  async function loadBab(babNumber) {
    setLoading(true)
    setError('')
    try {
      const data = await kosakataApi.listKosakata(token, { bab: babNumber })
      setItems(data)
    } catch (err) {
      setError(err.message || 'Gagal memuat kosakata.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBab(bab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bab])

  // Info hafalan (id yang ditandai + ringkasan angka, dan id yang
  // disembunyikan) global untuk semua bab, jadi cukup dimuat sekali saat
  // halaman dibuka -- tidak perlu reload tiap ganti bab/letak.
  async function loadHafalan() {
    setHafalanLoading(true)
    try {
      const [ids, stats, hiddenIdsResult] = await Promise.all([
        kosakataApi.listTandaiKosakataIds(token),
        kosakataApi.kosakataHafalanStats(token),
        kosakataApi.listKosakataTersembunyiIds(token),
      ])
      setMarkedIds(new Set(ids))
      setHafalanStats(stats)
      setHiddenIds(new Set(hiddenIdsResult))
    } catch {
      // Gagal muat info hafalan bukan error fatal -- halaman kosakata
      // tetap bisa dipakai normal tanpa panel info ini.
    } finally {
      setHafalanLoading(false)
    }
  }

  useEffect(() => {
    loadHafalan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const grouped = useMemo(() => {
    const map = {}
    for (const it of items) {
      if (!map[it.letak]) map[it.letak] = []
      map[it.letak].push(it)
    }
    return map
  }, [items])

  // Ringkasan hafalan khusus bab yang lagi dibuka, diambil dari
  // hafalanStats.per_bab (sudah mencakup semua bab sekaligus).
  const babHafalan = useMemo(() => {
    if (!hafalanStats) return null
    return hafalanStats.per_bab.find((b) => b.bab === bab) || { bab, ditandai: 0, total: 0 }
  }, [hafalanStats, bab])

  const currentItems = grouped[letak] || []

  // Kosakata yang disembunyikan HANYA pada letak (bagian) yang sedang
  // dibuka saat ini -- modal kotak sampah (🚮) mengikuti tab aktif, jadi
  // pindah tab -> isi kotak sampah ikut berganti ke letak itu saja.
  const hiddenInCurrentLetak = useMemo(
    () => currentItems.filter((it) => hiddenIds.has(it.id)),
    [currentItems, hiddenIds]
  )

  const hiddenCount = useMemo(
    () => hiddenInCurrentLetak.length,
    [hiddenInCurrentLetak]
  )

  // Nomor urut per kartu (mulai dari 1), dihitung dari SEMUA kartu di
  // bagian (letak) ini -- kartu yang disembunyikan dilewati (tidak dapat
  // nomor) supaya kartu yang tidak disembunyikan tetap bernomor rapat
  // 1,2,3,... tanpa lompatan. Otomatis menyesuaikan begitu kartu
  // disembunyikan/ditampilkan lagi (toggleHide).
  const numberById = useMemo(() => {
    const map = new Map()
    let n = 1
    for (const it of currentItems) {
      if (hiddenIds.has(it.id)) continue
      map.set(it.id, n)
      n += 1
    }
    return map
  }, [currentItems, hiddenIds])

  // Kartu yang disembunyikan TIDAK dirender di daftar bagian manapun --
  // sepenuhnya hilang dari tampilan letak, dan hanya bisa dilihat/
  // dikembalikan lewat modal kotak sampah (🚮).
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    const visible = currentItems.filter((it) => !hiddenIds.has(it.id))
    if (!q) return visible
    return visible.filter((it) =>
      (it.korean_text || '').toLowerCase().includes(q) ||
      (it.english_text || '').toLowerCase().includes(q) ||
      (it.indonesian_text || '').toLowerCase().includes(q)
    )
  }, [currentItems, search, hiddenIds])

  const activeLetak = LETAK_LIST.find((l) => l.key === letak)

  function changeLetak(key) {
    setLetak(key)
    setSearch('')
    setCardOverride({})
  }

  function openAddForm() {
    if (!canManage) return
    setFormMode('add')
    setEditingId(null)
    setFormData({
      ...EMPTY_FORM,
      bab: String(bab),
      letak,
      order_index: String(currentItems.length),
    })
    setFormError('')
    setFormOpen(true)
  }

  function openEditForm(item) {
    if (!canManage) return
    setFormMode('edit')
    setEditingId(item.id)
    setFormData({
      bab: String(item.bab),
      letak: item.letak,
      korean_text: item.korean_text || '',
      english_text: item.english_text || '',
      indonesian_text: item.indonesian_text || '',
      key_point: item.key_point || '',
      image_url: item.image_url || '',
      audio_url: item.audio_url || '',
      document_url: item.document_url || '',
      order_index: String(item.order_index ?? 0),
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
    const koreanTrimmed = formData.korean_text.trim()
    if (!koreanTrimmed) {
      setFormError('Teks Korea tidak boleh kosong.')
      return
    }

    const payload = {
      bab: Number(formData.bab),
      letak: formData.letak,
      korean_text: koreanTrimmed,
      english_text: formData.english_text.trim() || null,
      indonesian_text: formData.indonesian_text.trim() || null,
      key_point: formData.key_point.trim() || null,
      image_url: formData.image_url.trim() || null,
      audio_url: formData.audio_url.trim() || null,
      document_url: formData.document_url.trim() || null,
      order_index: Number(formData.order_index) || 0,
    }

    setSaving(true)
    setFormError('')
    try {
      if (formMode === 'edit' && editingId) {
        await kosakataApi.updateKosakata(editingId, payload, token)
      } else {
        await kosakataApi.createKosakata(payload, token)
      }
      const targetBab = payload.bab
      closeForm()
      if (targetBab !== bab) {
        setBab(targetBab) // useEffect akan reload otomatis
      } else {
        await loadBab(bab)
      }
      if (payload.letak !== letak) setLetak(payload.letak)
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan kosakata.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!canManage) return
    const label = item.korean_text || `#${item.id}`
    if (!window.confirm(`Hapus kosakata "${label}"? Tindakan ini tidak bisa dibatalkan.`)) return
    setDeletingId(item.id)
    setError('')
    try {
      await kosakataApi.deleteKosakata(item.id, token)
      await loadBab(bab)
    } catch (err) {
      setError(err.message || 'Gagal menghapus kosakata.')
    } finally {
      setDeletingId(null)
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

  function toggleViewMenu() {
    setViewMenuOpen((open) => !open)
  }

  function chooseViewMode(mode) {
    setViewMode(mode)
    setViewMenuOpen(false)
    setCardOverride({}) // ganti mode global -> override per kartu direset
  }

  function toggleCardOverride(itemId, value) {
    setCardOverride((prev) => {
      const isActive = prev[itemId] === value
      const next = { ...prev }
      if (isActive) {
        delete next[itemId] // klik tombol yang sama lagi -> nonaktifkan
      } else {
        next[itemId] = value // aktifkan (otomatis ganti kalau tombol lain aktif)
      }
      return next
    })
  }

  // Tandai/batal-tandai satu kosakata (bookmark hafalan). Update tampilan
  // duluan (optimistic) supaya kartu langsung berubah tanpa nunggu server,
  // lalu di-rollback kalau ternyata gagal.
  async function toggleMark(item) {
    const alreadyMarked = markedIds.has(item.id)
    setMarkingId(item.id)
    setMarkedIds((prev) => {
      const next = new Set(prev)
      if (alreadyMarked) next.delete(item.id)
      else next.add(item.id)
      return next
    })
    try {
      if (alreadyMarked) {
        await kosakataApi.hapusTandaiKosakata(item.id, token)
      } else {
        await kosakataApi.tandaiKosakata(item.id, token)
      }
      // Refresh angka ringkasan (total & per bab) supaya panel info tetap akurat.
      const stats = await kosakataApi.kosakataHafalanStats(token)
      setHafalanStats(stats)
    } catch (err) {
      setMarkedIds((prev) => {
        const next = new Set(prev)
        if (alreadyMarked) next.add(item.id)
        else next.delete(item.id)
        return next
      })
      setError(err.message || 'Gagal menandai kosakata.')
    } finally {
      setMarkingId(null)
    }
  }

  // Sembunyikan/tampilkan-lagi satu kosakata yang dianggap tidak penting.
  // Sama seperti toggleMark: optimistic update duluan, rollback kalau gagal.
  // Kartu yang disembunyikan otomatis tidak ikut dihitung di hafalanStats
  // (backend sudah mengecualikannya di /kosakata-tersembunyi/stats-hafalan),
  // jadi cukup refresh stats yang sama setelah berhasil.
  async function toggleHide(item) {
    const alreadyHidden = hiddenIds.has(item.id)
    setHidingId(item.id)
    setHiddenIds((prev) => {
      const next = new Set(prev)
      if (alreadyHidden) next.delete(item.id)
      else next.add(item.id)
      return next
    })
    try {
      if (alreadyHidden) {
        await kosakataApi.batalkanSembunyikanKosakata(item.id, token)
      } else {
        await kosakataApi.sembunyikanKosakata(item.id, token)
      }
      const stats = await kosakataApi.kosakataHafalanStats(token)
      setHafalanStats(stats)
    } catch (err) {
      setHiddenIds((prev) => {
        const next = new Set(prev)
        if (alreadyHidden) next.add(item.id)
        else next.delete(item.id)
        return next
      })
      setError(err.message || 'Gagal menyembunyikan kosakata.')
    } finally {
      setHidingId(null)
    }
  }

  function openTrash() {
    setTrashOpen(true)
  }

  function closeTrash() {
    setTrashOpen(false)
  }

  function openSqlImport() {
    if (!canManage) return
    setSqlText('')
    setSqlError('')
    setSqlResultCount(null)
    setSqlOpen(true)
  }

  function closeSqlImport() {
    setSqlOpen(false)
    setSqlError('')
    setSqlResultCount(null)
  }

  async function handleSqlImportSubmit(e) {
    e.preventDefault()
    if (!canManage) return
    if (!sqlText.trim()) {
      setSqlError('Kode SQL tidak boleh kosong.')
      return
    }
    setSqlSaving(true)
    setSqlError('')
    setSqlResultCount(null)
    try {
      // bab & letak SELALU ikut tab yang lagi dibuka -- baris SQL yang
      // tidak menyebut kolom bab/letak otomatis diisi oleh backend.
      const result = await kosakataApi.bulkImportKosakataSql(
        sqlText,
        { defaultBab: bab, defaultLetak: letak },
        token
      )
      setSqlResultCount(result.inserted)
      setSqlText('')
      await loadBab(bab)
    } catch (err) {
      setSqlError(err.message || 'Gagal mengimpor kosakata dari SQL.')
    } finally {
      setSqlSaving(false)
    }
  }

  return (
    <div className="ka-page">
      <Link className="back-link" to="/dashboard">&larr; Kembali ke Dashboard</Link>

      <div className="ka-header">
        <span className="ka-header-icon" aria-hidden="true">冊</span>
        <div>
          <h1>{canManage ? 'Kosakata Admin' : 'Kosakata'}</h1>
          <p>{canManage ? 'Kelola kosakata per bab & bagian' : 'Daftar kosakata per bab & bagian'}</p>
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

      {/* ── Info hafalan: total ditandai + progres bab yang lagi dibuka ── */}
      {!hafalanLoading && hafalanStats && babHafalan && (
        <div className="ka-hafalan-info">
          <div className="ka-hafalan-row">
            <div className="ka-hafalan-item">
              <span className="ka-hafalan-label">Ditandai (semua bab)</span>
              <span className="ka-hafalan-value">
                {hafalanStats.ditandai}/{hafalanStats.total}
              </span>
            </div>
            <div className="ka-hafalan-item">
              <span className="ka-hafalan-label">Bab {bab}</span>
              <span className="ka-hafalan-value">
                {babHafalan.ditandai}/{babHafalan.total}
              </span>
            </div>
          </div>
          <div className="ka-hafalan-bar" aria-hidden="true">
            <div
              className="ka-hafalan-bar-fill"
              style={{
                width: `${babHafalan.total ? Math.round((babHafalan.ditandai / babHafalan.total) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      <nav className="ka-tabs" aria-label="Bagian dalam bab">
        {LETAK_LIST.map((l) => (
          <button
            key={l.key}
            type="button"
            className={`ka-tab ${letak === l.key ? 'active' : ''}`}
            onClick={() => changeLetak(l.key)}
          >
            {l.label}
            {grouped[l.key]?.length ? (
              <span className="ka-tab-count">
                {(() => {
                  const visible = grouped[l.key].filter((it) => !hiddenIds.has(it.id))
                  return `${visible.filter((it) => markedIds.has(it.id)).length}/${visible.length}`
                })()}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {activeLetak?.desc && <p className="ka-tab-desc">{activeLetak.desc}</p>}

      <div className="ka-toolbar">
        <input
          type="text"
          className="ka-search"
          placeholder="Cari di bagian ini…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="ka-view-menu-wrap">
          <button
            type="button"
            className="ka-view-menu-btn"
            onClick={toggleViewMenu}
            aria-label="Mode tampilan"
            aria-expanded={viewMenuOpen}
          >
            ⋮
          </button>
          {viewMenuOpen && (
            <>
              <div className="ka-view-menu-backdrop" onClick={() => setViewMenuOpen(false)} />
              <div className="ka-view-menu">
                <button
                  type="button"
                  className={`ka-view-menu-item ${viewMode === 'all' ? 'active' : ''}`}
                  onClick={() => chooseViewMode('all')}
                >
                  Tampilkan semua
                </button>
                <button
                  type="button"
                  className={`ka-view-menu-item ${viewMode === 'korean_only' ? 'active' : ''}`}
                  onClick={() => chooseViewMode('korean_only')}
                >
                  Hanya Korea
                </button>
                <button
                  type="button"
                  className={`ka-view-menu-item ${viewMode === 'indo_only' ? 'active' : ''}`}
                  onClick={() => chooseViewMode('indo_only')}
                >
                  Hanya Indonesia
                </button>
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          className="ka-trash-menu-btn"
          onClick={openTrash}
          aria-label="Lihat kosakata yang disembunyikan"
          title="Kosakata yang disembunyikan"
        >
          🚮
          {hiddenCount > 0 && <span className="ka-trash-count">{hiddenCount}</span>}
        </button>
        {canManage && (
          <>
            <button type="button" className="ka-sql-btn" onClick={openSqlImport}>
              Impor SQL
            </button>
            <button type="button" className="ka-add-btn" onClick={openAddForm}>
              + Tambah
            </button>
          </>
        )}
      </div>

      {error && <p className="auth-error">{error}</p>}

      {loading ? (
        <p className="ka-status">Memuat…</p>
      ) : filteredItems.length === 0 ? (
        <p className="ka-empty">
          {search
            ? 'Tidak ada kosakata yang cocok dengan pencarian.'
            : currentItems.length > 0
              ? 'Semua kosakata di bagian ini disembunyikan. Buka 🚮 untuk menampilkannya lagi.'
              : `Belum ada kosakata di bagian "${activeLetak?.label}" untuk Bab ${bab}.`}
        </p>
      ) : (
        <ul className="ka-list">
          {filteredItems.map((item) => {
            // Mode tampilan efektif untuk kartu ini: override per-kartu
            // (kalau ada) menang atas mode global.
            const override = cardOverride[item.id]
            let effectiveMode = viewMode
            if (viewMode === 'all' && override) {
              effectiveMode = override // 'korean_only' | 'indo_only'
            } else if (viewMode !== 'all' && override === 'translation') {
              effectiveMode = 'all'
            }

            return (
              <li key={item.id} className="ka-card">
                <div className="ka-card-main">
                  <span className="ka-card-number" aria-hidden="true">
                    {numberById.get(item.id)}
                  </span>
                  {effectiveMode !== 'indo_only' && (
                    <p className="ka-korean" lang="ko">{item.korean_text}</p>
                  )}
                  {effectiveMode === 'all' && item.english_text && (
                    <p className="ka-english">{item.english_text}</p>
                  )}
                  {effectiveMode !== 'korean_only' && item.indonesian_text && (
                    <p className="ka-indonesian">{item.indonesian_text}</p>
                  )}
                  {effectiveMode === 'all' && item.key_point && (
                    <p className="ka-keypoint">★ {item.key_point}</p>
                  )}

                  {(item.image_url || item.audio_url || item.document_url) && (
                    <div className="ka-media-badges">
                      {item.image_url && (
                        <a href={item.image_url} target="_blank" rel="noreferrer" className="ka-media-badge">
                          <span aria-hidden="true">{MEDIA_ICON.image_url}</span> Gambar
                        </a>
                      )}
                      {item.audio_url && (
                        <a href={item.audio_url} target="_blank" rel="noreferrer" className="ka-media-badge">
                          <span aria-hidden="true">{MEDIA_ICON.audio_url}</span> Audio
                        </a>
                      )}
                      {item.document_url && (
                        <a href={item.document_url} target="_blank" rel="noreferrer" className="ka-media-badge">
                          <span aria-hidden="true">{MEDIA_ICON.document_url}</span> Dokumen
                        </a>
                      )}
                    </div>
                  )}

                  <div className="ka-card-toggles">
                    {viewMode === 'all' ? (
                      <>
                        <button
                          type="button"
                          className={`ka-toggle-btn ${override === 'korean_only' ? 'active' : ''}`}
                          onClick={() => toggleCardOverride(item.id, 'korean_only')}
                        >
                          🇰🇷
                        </button>
                        <button
                          type="button"
                          className={`ka-toggle-btn ${override === 'indo_only' ? 'active' : ''}`}
                          onClick={() => toggleCardOverride(item.id, 'indo_only')}
                        >
                          🇮🇩
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className={`ka-toggle-btn ${override === 'translation' ? 'active' : ''}`}
                        onClick={() => toggleCardOverride(item.id, 'translation')}
                      >
                        🌐
                      </button>
                    )}
                  </div>
                </div>
                <div className="ka-card-side">
                  <button
                    type="button"
                    className={`ka-mark-btn ${markedIds.has(item.id) ? 'active' : ''}`}
                    onClick={() => toggleMark(item)}
                    disabled={markingId === item.id}
                    aria-pressed={markedIds.has(item.id)}
                    aria-label={markedIds.has(item.id) ? 'Batalkan tanda hafalan' : 'Tandai untuk hafalan'}
                    title={markedIds.has(item.id) ? 'Sudah ditandai — klik untuk batal' : 'Tandai kosakata ini'}
                  >
                    {markedIds.has(item.id) ? '★' : '☆'}
                  </button>
                  {canManage && (
                    <div className="ka-card-actions">
                      <button type="button" className="ka-edit-btn" onClick={() => openEditForm(item)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="ka-delete-btn"
                        disabled={deletingId === item.id}
                        onClick={() => handleDelete(item)}
                      >
                        {deletingId === item.id ? '…' : 'Hapus'}
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="ka-trash-btn"
                  onClick={() => toggleHide(item)}
                  disabled={hidingId === item.id}
                  aria-label="Sembunyikan kosakata ini"
                  title="Sembunyikan (tidak ikut dihitung hafalan)"
                >
                  🗑️
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* ── Modal tambah/edit ───────────────────────────────────── */}
      {formOpen && (
        <div className="ka-modal-backdrop" onClick={closeForm}>
          <div className="ka-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{formMode === 'add' ? 'Tambah Kosakata' : 'Edit Kosakata'}</h2>
            <form onSubmit={handleFormSubmit} className="ka-form">
              <div className="ka-form-row-2">
                <label className="ka-field">
                  <span>Bab</span>
                  <select
                    value={formData.bab}
                    onChange={(e) => handleFormField('bab', e.target.value)}
                  >
                    {Array.from({ length: BAB_COUNT }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>Bab {n}</option>
                    ))}
                  </select>
                </label>
                <label className="ka-field">
                  <span>Letak</span>
                  <select
                    value={formData.letak}
                    onChange={(e) => handleFormField('letak', e.target.value)}
                  >
                    {LETAK_LIST.map((l) => (
                      <option key={l.key} value={l.key}>{l.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="ka-field">
                <span>Teks Korea</span>
                <textarea
                  required
                  rows={2}
                  value={formData.korean_text}
                  onChange={(e) => handleFormField('korean_text', e.target.value)}
                  placeholder="예: 안녕하세요"
                />
              </label>

              <label className="ka-field">
                <span>Terjemahan Inggris</span>
                <textarea
                  rows={2}
                  value={formData.english_text}
                  onChange={(e) => handleFormField('english_text', e.target.value)}
                  placeholder="mis. Hello"
                />
              </label>

              <label className="ka-field">
                <span>Terjemahan Indonesia</span>
                <textarea
                  rows={2}
                  value={formData.indonesian_text}
                  onChange={(e) => handleFormField('indonesian_text', e.target.value)}
                  placeholder="mis. Halo"
                />
              </label>

              <label className="ka-field">
                <span>Poin Penting</span>
                <textarea
                  rows={2}
                  value={formData.key_point}
                  onChange={(e) => handleFormField('key_point', e.target.value)}
                  placeholder="Catatan/penjelasan tambahan (opsional)"
                />
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
                </label>
              ))}

              <label className="ka-field">
                <span>Urutan Tampil</span>
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => handleFormField('order_index', e.target.value)}
                />
              </label>

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

      {/* ── Modal impor via SQL ─────────────────────────────────── */}
      {sqlOpen && (
        <div className="ka-modal-backdrop" onClick={closeSqlImport}>
          <div className="ka-modal ka-sql-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Impor Kosakata via SQL</h2>
            <p className="ka-sql-help">
              Tempel daftar <code>(korean_text, english_text, indonesian_text, key_point)</code>{' '}
              di bawah ini untuk menambah banyak kosakata sekaligus -- satu baris per tuple,
              urutannya <strong>teks Korea, terjemahan Inggris, terjemahan Indonesia, keterangan</strong>.
              Kolom <strong>bab</strong> &amp; <strong>letak</strong> otomatis diisi{' '}
              <strong>Bab {bab}</strong> &amp; <strong>{activeLetak?.label}</strong> (bagian yang
              sedang dibuka), dan <strong>urutan tampil</strong> otomatis melanjutkan dari
              kosakata yang sudah ada di bagian ini. Kalau keterangan kosong, tulis{' '}
              <code>NULL</code>.
            </p>

            <form onSubmit={handleSqlImportSubmit} className="ka-form">
              <textarea
                className="ka-sql-textarea"
                rows={10}
                spellCheck={false}
                value={sqlText}
                onChange={(e) => setSqlText(e.target.value)}
                placeholder={
                  `('안녕하세요', 'Hello', 'Halo', NULL),\n` +
                  `('감사합니다', 'Thank you', 'Terima kasih', NULL);`
                }
              />

              <p className="ka-sql-target-info">
                Akan disimpan ke <strong>Bab {bab}</strong> · <strong>{activeLetak?.label}</strong>
              </p>

              {sqlError && <p className="auth-error">{sqlError}</p>}
              {sqlResultCount !== null && (
                <p className="ka-sql-success">
                  ✓ Berhasil menambah {sqlResultCount} kosakata.
                </p>
              )}

              <div className="ka-form-actions">
                <button type="button" className="ka-cancel-btn" onClick={closeSqlImport}>
                  Tutup
                </button>
                <button type="submit" className="ka-save-btn" disabled={sqlSaving}>
                  {sqlSaving ? 'Mengimpor…' : 'Impor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal kotak sampah (🚮): kosakata disembunyikan DI LETAK INI SAJA ── */}
      {trashOpen && (
        <div className="ka-modal-backdrop" onClick={closeTrash}>
          <div className="ka-modal ka-trash-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🚮 Disembunyikan — {activeLetak?.label} (Bab {bab})</h2>
            {hiddenInCurrentLetak.length === 0 ? (
              <p className="ka-empty">Belum ada kosakata yang disembunyikan di bagian ini.</p>
            ) : (
              <ul className="ka-trash-item-list">
                {hiddenInCurrentLetak.map((it) => (
                  <li className="ka-trash-item" key={it.id}>
                    <div className="ka-trash-item-text">
                      <span className="ka-trash-item-korean" lang="ko">{it.korean_text}</span>
                      {it.indonesian_text && (
                        <span className="ka-trash-item-indo">{it.indonesian_text}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="ka-unhide-btn"
                      onClick={() => toggleHide(it)}
                      disabled={hidingId === it.id}
                    >
                      {hidingId === it.id ? '…' : 'Tampilkan'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="ka-form-actions">
              <button type="button" className="ka-cancel-btn" onClick={closeTrash}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
