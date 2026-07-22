import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import { fileManagerApi } from '../api'
import '../../../shared/styles/Auth.css'
import './FileManager.css'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function extOf(name) {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot + 1).toUpperCase()
}

export default function FileManager() {
  const { token } = useAuth()
  const inputRef = useRef(null)

  const [tab, setTab] = useState('folder') // 'folder' | 'library'

  const [prefix, setPrefix] = useState('') // folder yang lagi dibuka, "" = root
  const [folders, setFolders] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [busyKey, setBusyKey] = useState(null) // key/prefix yang lagi diproses (delete tunggal)

  // ── Upload banyak file sekaligus ──────────────────────────────
  const [uploadQueue, setUploadQueue] = useState([]) // [{ name, status: 'pending'|'uploading'|'done'|'error', error? }]
  const uploading = uploadQueue.some((q) => q.status === 'pending' || q.status === 'uploading')

  // ── Pilih banyak file untuk dihapus sekaligus ─────────────────
  const [selected, setSelected] = useState(() => new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // ── Tab "Library" (struktur folder dari Cloudinary + nama dari database) ──
  const [libPrefix, setLibPrefix] = useState('') // folder yang lagi dibuka di tab Library
  const [libFolders, setLibFolders] = useState([])
  const [libItems, setLibItems] = useState([])
  const [libLoading, setLibLoading] = useState(false)
  const [libError, setLibError] = useState('')
  const [libSyncing, setLibSyncing] = useState(false)
  const [libSyncMsg, setLibSyncMsg] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [libBusyId, setLibBusyId] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null) // id/key item yang menu ⋮-nya lagi terbuka

  async function load(targetPrefix) {
    setLoading(true)
    setError('')
    try {
      const data = await fileManagerApi.listFiles(targetPrefix, token)
      setFolders(data.folders)
      setFiles(data.files)
      setSelected(new Set())
    } catch (err) {
      setError(err.message || 'Gagal memuat isi folder.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(prefix)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix])

  async function loadLibrary(targetPrefix) {
    setLibLoading(true)
    setLibError('')
    try {
      const data = await fileManagerApi.browseLibrary(targetPrefix, token)
      setLibFolders(data.folders)
      setLibItems(data.files)
    } catch (err) {
      setLibError(err.message || 'Gagal memuat media library.')
    } finally {
      setLibLoading(false)
    }
  }

  useEffect(() => {
    if (tab !== 'library') return
    setOpenMenuId(null)
    loadLibrary(libPrefix)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, libPrefix])

  function openLibFolder(folderPrefix) {
    setLibPrefix(folderPrefix)
  }

  function libGoUp(toPrefix) {
    setLibPrefix(toPrefix)
  }

  const libCrumbs = libPrefix
    ? libPrefix.replace(/\/$/, '').split('/').reduce((acc, part, i) => {
        const path = (i === 0 ? '' : acc[i - 1].path) + part + '/'
        acc.push({ name: part, path })
        return acc
      }, [])
    : []

  async function handleSyncLibrary() {
    setLibSyncing(true)
    setLibError('')
    setLibSyncMsg('')
    try {
      const result = await fileManagerApi.syncLibrary(token)
      setLibSyncMsg(
        `Selesai: ${result.scanned} file ditemukan di Cloudinary, ${result.inserted} baru dicatat, ${result.skipped} sudah ada sebelumnya.`
      )
      await loadLibrary(libPrefix)
    } catch (err) {
      setLibError(err.message || 'Gagal sinkron dari Cloudinary.')
    } finally {
      setLibSyncing(false)
    }
  }

  async function handleRegisterLibraryFile(item) {
    setLibBusyId(item.key)
    setLibError('')
    try {
      const registered = await fileManagerApi.registerLibraryFile(
        {
          public_id: item.key,
          resource_type: item.resource_type,
          url: item.url,
          original_name: item.original_name,
          size_bytes: item.size,
          folder: libPrefix.replace(/\/$/, ''),
        },
        token
      )
      setLibItems((prev) =>
        prev.map((f) =>
          f.key === item.key
            ? { ...f, in_library: true, id: registered.id, display_name: registered.display_name, source: registered.source }
            : f
        )
      )
    } catch (err) {
      setLibError(err.message || 'Gagal menambahkan file ke library.')
    } finally {
      setLibBusyId(null)
    }
  }

  function startRename(item) {
    setEditingId(item.key)
    setEditingName(item.display_name)
  }

  function cancelRename() {
    setEditingId(null)
    setEditingName('')
  }

  async function saveRename(item) {
    const name = editingName.trim()
    if (!name || name === item.display_name) {
      cancelRename()
      return
    }
    setLibBusyId(item.key)
    setLibError('')
    try {
      const updated = await fileManagerApi.renameLibraryFile(item.id, name, token)
      setLibItems((prev) =>
        prev.map((f) => (f.key === item.key ? { ...f, display_name: updated.display_name } : f))
      )
      cancelRename()
    } catch (err) {
      setLibError(err.message || 'Gagal mengganti nama file.')
    } finally {
      setLibBusyId(null)
    }
  }

  async function handleDeleteLibraryFile(item) {
    if (!window.confirm(`Hapus "${item.display_name}" dari Cloudinary & media library? Tindakan ini tidak bisa dibatalkan.`)) return
    setLibBusyId(item.key)
    setLibError('')
    try {
      await fileManagerApi.deleteLibraryFile(item.id, token)
      setLibItems((prev) => prev.filter((f) => f.key !== item.key))
    } catch (err) {
      setLibError(err.message || 'Gagal menghapus file.')
    } finally {
      setLibBusyId(null)
    }
  }

  function openFolder(folderPrefix) {
    setPrefix(folderPrefix)
  }

  function goUp(toPrefix) {
    setPrefix(toPrefix)
  }

  const crumbs = prefix
    ? prefix.replace(/\/$/, '').split('/').reduce((acc, part, i) => {
        const path = (i === 0 ? '' : acc[i - 1].path) + part + '/'
        acc.push({ name: part, path })
        return acc
      }, [])
    : []

  async function handleFilesPicked(fileList) {
    const pickedFiles = Array.from(fileList || [])
    if (pickedFiles.length === 0) return

    setError('')
    setUploadQueue(pickedFiles.map((f) => ({ name: f.name, status: 'pending' })))

    // Upload satu per satu supaya progres tiap file kelihatan jelas
    // dan tidak membanjiri koneksi kalau file-nya banyak.
    let hadError = false
    for (let i = 0; i < pickedFiles.length; i++) {
      const file = pickedFiles[i]
      setUploadQueue((q) => q.map((item, idx) => (idx === i ? { ...item, status: 'uploading' } : item)))
      try {
        await fileManagerApi.uploadAsset(file, prefix, token)
        setUploadQueue((q) => q.map((item, idx) => (idx === i ? { ...item, status: 'done' } : item)))
      } catch (err) {
        hadError = true
        setUploadQueue((q) =>
          q.map((item, idx) =>
            idx === i ? { ...item, status: 'error', error: err.message || 'Gagal diunggah.' } : item
          )
        )
      }
    }

    await load(prefix)
    if (hadError) {
      setError('Sebagian file gagal diunggah. Lihat rincian di daftar unggahan.')
    } else {
      setUploadQueue([])
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleCreateFolder(e) {
    e.preventDefault()
    const name = newFolderName.trim()
    if (!name) return
    setError('')
    try {
      await fileManagerApi.createFolder(`${prefix}${name}`, token)
      setNewFolderName('')
      setShowNewFolder(false)
      await load(prefix)
    } catch (err) {
      setError(err.message || 'Gagal membuat folder.')
    }
  }

  async function handleDeleteFile(key, name) {
    if (!window.confirm(`Hapus file "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return
    setBusyKey(key)
    setError('')
    try {
      await fileManagerApi.deleteFile(key, token)
      await load(prefix)
    } catch (err) {
      setError(err.message || 'Gagal menghapus file.')
    } finally {
      setBusyKey(null)
    }
  }

  async function handleDeleteFolder(folderPrefix, name) {
    if (!window.confirm(`Hapus folder "${name}" beserta SEMUA isinya? Tindakan ini tidak bisa dibatalkan.`)) return
    setBusyKey(folderPrefix)
    setError('')
    try {
      await fileManagerApi.deleteFolder(folderPrefix, token)
      await load(prefix)
    } catch (err) {
      setError(err.message || 'Gagal menghapus folder.')
    } finally {
      setBusyKey(null)
    }
  }

  function toggleSelect(key) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleSelectAll() {
    setSelected((prev) => {
      if (prev.size === files.length) return new Set()
      return new Set(files.map((f) => f.key))
    })
  }

  async function handleDeleteSelected() {
    const keys = Array.from(selected)
    if (keys.length === 0) return
    if (!window.confirm(`Hapus ${keys.length} file terpilih? Tindakan ini tidak bisa dibatalkan.`)) return

    setBulkDeleting(true)
    setError('')
    try {
      await fileManagerApi.deleteFilesBulk(keys, token)
      await load(prefix)
    } catch (err) {
      setError(err.message || 'Gagal menghapus file terpilih.')
    } finally {
      setBulkDeleting(false)
    }
  }

  async function copyUrl(url) {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // clipboard tidak tersedia -> biarkan saja, user bisa tap & pilih URL manual
    }
  }

  const allSelected = files.length > 0 && selected.size === files.length

  return (
    <div className="auth-page">
      <span className="auth-watermark" aria-hidden="true">庫</span>

      <div className="auth-card fm-card">
        <p className="auth-entry-no">ENTRI · 0087</p>
        <h1 className="auth-headword" lang="ko">파일 관리</h1>
        <p className="auth-gloss">
          <span className="pos">n.</span> kelola aset di Cloudinary
        </p>
        <hr className="auth-divider" />

        <div className="fm-tabs">
          <button
            type="button"
            className={`fm-tab ${tab === 'folder' ? 'active' : ''}`}
            onClick={() => setTab('folder')}
          >
            Folder
          </button>
          <button
            type="button"
            className={`fm-tab ${tab === 'library' ? 'active' : ''}`}
            onClick={() => setTab('library')}
          >
            Library
          </button>
        </div>

        {tab === 'folder' && (
        <>
        <nav className="fm-breadcrumb">
          <button type="button" onClick={() => goUp('')} className={!prefix ? 'active' : ''}>
            root
          </button>
          {crumbs.map((c) => (
            <span key={c.path}>
              <span className="fm-breadcrumb-sep">/</span>
              <button
                type="button"
                onClick={() => goUp(c.path)}
                className={prefix === c.path ? 'active' : ''}
              >
                {c.name}
              </button>
            </span>
          ))}
        </nav>

        <div className="fm-toolbar">
          <button type="button" className="fm-tool-btn" onClick={() => setShowNewFolder((v) => !v)}>
            + Folder
          </button>
          <label className="fm-tool-btn fm-upload-btn">
            {uploading ? 'Mengunggah…' : '+ Unggah'}
            <input
              ref={inputRef}
              type="file"
              hidden
              multiple
              disabled={uploading}
              onChange={(e) => handleFilesPicked(e.target.files)}
            />
          </label>
        </div>

        {showNewFolder && (
          <form className="fm-new-folder" onSubmit={handleCreateFolder}>
            <input
              type="text"
              placeholder="Nama folder"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
            <button type="submit" className="fm-tool-btn">Buat</button>
          </form>
        )}

        {uploadQueue.length > 0 && (
          <ul className="fm-upload-queue">
            {uploadQueue.map((item, i) => (
              <li key={`${item.name}-${i}`} className={`fm-upload-item fm-upload-${item.status}`}>
                <span className="fm-upload-name">{item.name}</span>
                <span className="fm-upload-status">
                  {item.status === 'pending' && 'menunggu…'}
                  {item.status === 'uploading' && 'mengunggah…'}
                  {item.status === 'done' && 'selesai ✓'}
                  {item.status === 'error' && (item.error || 'gagal')}
                </span>
              </li>
            ))}
            {!uploading && (
              <li className="fm-upload-clear">
                <button type="button" className="fm-tool-btn" onClick={() => setUploadQueue([])}>
                  Tutup daftar unggahan
                </button>
              </li>
            )}
          </ul>
        )}

        {error && <p className="auth-error">{error}</p>}

        {files.length > 0 && (
          <div className="fm-bulkbar">
            <label className="fm-bulkbar-select">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
              Pilih semua file
            </label>
            {selected.size > 0 && (
              <button
                type="button"
                className="fm-bulkbar-delete"
                disabled={bulkDeleting}
                onClick={handleDeleteSelected}
              >
                {bulkDeleting ? 'Menghapus…' : `Hapus ${selected.size} terpilih`}
              </button>
            )}
          </div>
        )}

        {loading ? (
          <p className="status-line">Memuat…</p>
        ) : (
          <ul className="fm-list">
            {folders.length === 0 && files.length === 0 && (
              <li className="fm-empty">Folder ini kosong.</li>
            )}

            {folders.map((f) => {
              const name = f.replace(prefix, '').replace(/\/$/, '')
              return (
                <li key={f} className="fm-row">
                  <button type="button" className="fm-row-main" onClick={() => openFolder(f)}>
                    <span className="fm-icon fm-icon-folder" aria-hidden="true">冊</span>
                    <span className="fm-row-name">{name}/</span>
                  </button>
                  <button
                    type="button"
                    className="fm-row-delete"
                    disabled={busyKey === f}
                    onClick={() => handleDeleteFolder(f, name)}
                  >
                    {busyKey === f ? '…' : 'Hapus'}
                  </button>
                </li>
              )
            })}

            {files.map((file) => (
              <li key={file.key} className="fm-row">
                <input
                  type="checkbox"
                  className="fm-row-checkbox"
                  checked={selected.has(file.key)}
                  onChange={() => toggleSelect(file.key)}
                  aria-label={`Pilih ${file.name}`}
                />
                <a
                  className="fm-row-main"
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="fm-icon" aria-hidden="true">{extOf(file.name) || '·'}</span>
                  <span className="fm-row-name">
                    {file.name}
                    <span className="fm-row-meta">{formatSize(file.size)}</span>
                  </span>
                </a>
                <button type="button" className="fm-row-copy" onClick={() => copyUrl(file.url)}>
                  Salin
                </button>
                <button
                  type="button"
                  className="fm-row-delete"
                  disabled={busyKey === file.key}
                  onClick={() => handleDeleteFile(file.key, file.name)}
                >
                  {busyKey === file.key ? '…' : 'Hapus'}
                </button>
              </li>
            ))}
          </ul>
        )}
        </>
        )}

        {tab === 'library' && (
        <div className="fm-lib">
          <nav className="fm-breadcrumb">
            <button type="button" onClick={() => libGoUp('')} className={!libPrefix ? 'active' : ''}>
              root
            </button>
            {libCrumbs.map((c) => (
              <span key={c.path}>
                <span className="fm-breadcrumb-sep">/</span>
                <button
                  type="button"
                  onClick={() => libGoUp(c.path)}
                  className={libPrefix === c.path ? 'active' : ''}
                >
                  {c.name}
                </button>
              </span>
            ))}
          </nav>

          <button
            type="button"
            className="fm-tool-btn fm-lib-sync"
            disabled={libSyncing}
            onClick={handleSyncLibrary}
          >
            {libSyncing ? 'Menyinkronkan…' : '⟳ Sync dari Cloudinary'}
          </button>
          <p className="fm-lib-hint">
            Tangkap file yang di-upload manual langsung lewat dashboard Cloudinary.
          </p>

          {libSyncMsg && <p className="fm-lib-sync-msg">{libSyncMsg}</p>}
          {libError && <p className="auth-error">{libError}</p>}

          {libLoading ? (
            <p className="status-line">Memuat…</p>
          ) : (
            <ul className="fm-list">
              {libFolders.length === 0 && libItems.length === 0 && (
                <li className="fm-empty">Folder ini kosong.</li>
              )}

              {libFolders.map((f) => {
                const name = f.replace(libPrefix, '').replace(/\/$/, '')
                return (
                  <li key={f} className="fm-row">
                    <button type="button" className="fm-row-main" onClick={() => openLibFolder(f)}>
                      <span className="fm-icon fm-icon-folder" aria-hidden="true">冊</span>
                      <span className="fm-row-name">{name}/</span>
                    </button>
                  </li>
                )
              })}

              {libItems.map((item) => (
                <li key={item.key} className="fm-row fm-row-lib">
                  {editingId === item.key ? (
                    <div className="fm-lib-edit">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(item)
                          if (e.key === 'Escape') cancelRename()
                        }}
                      />
                      <button
                        type="button"
                        className="fm-row-copy"
                        disabled={libBusyId === item.key}
                        onClick={() => saveRename(item)}
                      >
                        {libBusyId === item.key ? '…' : 'Simpan'}
                      </button>
                      <button type="button" className="fm-row-copy" onClick={cancelRename}>
                        Batal
                      </button>
                    </div>
                  ) : (
                    <>
                      <a
                        className="fm-row-main fm-row-main-lib"
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="fm-icon" aria-hidden="true">
                          {extOf(item.original_name) || '·'}
                        </span>
                        <span className="fm-row-name fm-row-name-lib">
                          {item.display_name}
                          <span className="fm-row-meta">
                            {item.file_category}
                            {item.size ? ` · ${formatSize(item.size)}` : ''}
                            {!item.in_library && ' · belum di-sync'}
                          </span>
                        </span>
                      </a>

                      <div className="fm-menu-wrap">
                        <button
                          type="button"
                          className="fm-menu-trigger"
                          disabled={libBusyId === item.key}
                          onClick={() => setOpenMenuId(openMenuId === item.key ? null : item.key)}
                          aria-label="Menu aksi"
                        >
                          {libBusyId === item.key ? '…' : '⋮'}
                        </button>

                        {openMenuId === item.key && (
                          <>
                            <div className="fm-menu-backdrop" onClick={() => setOpenMenuId(null)} />
                            <div className="fm-menu-popup">
                              <button
                                type="button"
                                onClick={() => {
                                  copyUrl(item.url)
                                  setOpenMenuId(null)
                                }}
                              >
                                Salin URL
                              </button>
                              {item.in_library ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      startRename(item)
                                      setOpenMenuId(null)
                                    }}
                                  >
                                    Ganti nama
                                  </button>
                                  <button
                                    type="button"
                                    className="fm-menu-danger"
                                    onClick={() => {
                                      setOpenMenuId(null)
                                      handleDeleteLibraryFile(item)
                                    }}
                                  >
                                    Hapus
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null)
                                    handleRegisterLibraryFile(item)
                                  }}
                                >
                                  Tambahkan ke Library
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        )}

        <p className="auth-crossref">
          → <Link to="/dashboard">Kembali ke Dashboard</Link>
        </p>
      </div>
    </div>
  )
}
