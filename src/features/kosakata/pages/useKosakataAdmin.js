import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { kosakataApi } from '../api'
import { LETAK_LIST } from '../../../shared/constants/letak'

export const EMPTY_FORM = {
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

// Semua state & logic halaman Kosakata Admin dikumpulkan di sini supaya
// komponen KosakataAdmin.jsx cukup fokus merender tampilan (JSX) saja.
export function useKosakataAdmin() {
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

  return {
    token,
    canManage,
    bab,
    setBab,
    letak,
    grouped,
    items,
    loading,
    error,
    search,
    setSearch,
    markedIds,
    markingId,
    hafalanStats,
    hafalanLoading,
    hiddenIds,
    hidingId,
    trashOpen,
    viewMode,
    viewMenuOpen,
    setViewMenuOpen,
    cardOverride,
    formOpen,
    formMode,
    formData,
    formError,
    saving,
    deletingId,
    pickerField,
    sqlOpen,
    sqlText,
    setSqlText,
    sqlSaving,
    sqlError,
    sqlResultCount,
    babHafalan,
    currentItems,
    hiddenInCurrentLetak,
    hiddenCount,
    numberById,
    filteredItems,
    activeLetak,
    changeLetak,
    openAddForm,
    openEditForm,
    closeForm,
    handleFormField,
    handleFormSubmit,
    handleDelete,
    openPicker,
    closePicker,
    selectPickerItem,
    toggleViewMenu,
    chooseViewMode,
    toggleCardOverride,
    toggleMark,
    toggleHide,
    openTrash,
    closeTrash,
    openSqlImport,
    closeSqlImport,
    handleSqlImportSubmit,
  }
}
