import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fileManagerApi } from '../api'
import '../pages/FileManager.css'

const PICKER_LABEL = { image: 'gambar', audio: 'audio', document: 'dokumen' }

function extOf(name) {
  const dot = (name || '').lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot + 1).toUpperCase()
}

/**
 * Popup "Pilih dari Library" dipakai di form Kosakata & Buku.
 * - Struktur folder mengikuti Cloudinary secara real-time (lewat
 *   /admin/library/browse, sama seperti tab "Library" di File Manager).
 * - Nama file yang ditampilkan mengikuti Library (display_name dari
 *   tabel `files` kalau sudah tercatat, fallback ke nama asli).
 * - Difilter di sisi client berdasarkan `category` (image/audio/document)
 *   supaya folder tetap bisa dijelajahi meski isinya campuran jenis file.
 *
 * Props:
 *   category: 'image' | 'audio' | 'document'
 *   token: JWT
 *   onSelect(url): dipanggil saat user memilih satu file
 *   onClose(): dipanggil saat popup ditutup
 */
export default function LibraryPicker({ category, token, onSelect, onClose }) {
  const [prefix, setPrefix] = useState('')
  const [folders, setFolders] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  async function load(targetPrefix) {
    setLoading(true)
    setError('')
    try {
      const data = await fileManagerApi.browseLibrary(targetPrefix, token)
      setFolders(data.folders)
      setFiles(data.files)
    } catch (err) {
      setError(err.message || 'Gagal memuat folder dari Cloudinary.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(prefix)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix])

  const crumbs = prefix
    ? prefix.replace(/\/$/, '').split('/').reduce((acc, part, i) => {
        const path = (i === 0 ? '' : acc[i - 1].path) + part + '/'
        acc.push({ name: part, path })
        return acc
      }, [])
    : []

  const q = search.trim().toLowerCase()
  const visibleFiles = files
    .filter((f) => f.file_category === category)
    .filter((f) => !q || f.display_name.toLowerCase().includes(q))

  return (
    <div className="ka-modal-backdrop" onClick={onClose}>
      <div className="ka-modal ka-picker" onClick={(e) => e.stopPropagation()}>
        <h2>Pilih {PICKER_LABEL[category]} dari Library</h2>

        <nav className="fm-breadcrumb">
          <button type="button" onClick={() => setPrefix('')} className={!prefix ? 'active' : ''}>
            root
          </button>
          {crumbs.map((c) => (
            <span key={c.path}>
              <span className="fm-breadcrumb-sep">/</span>
              <button
                type="button"
                onClick={() => setPrefix(c.path)}
                className={prefix === c.path ? 'active' : ''}
              >
                {c.name}
              </button>
            </span>
          ))}
        </nav>

        <div className="ka-picker-search">
          <input
            type="text"
            placeholder={`Cari ${PICKER_LABEL[category]} di folder ini…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && <p className="auth-error">{error}</p>}

        {loading ? (
          <p className="ka-status">Memuat…</p>
        ) : (
          <ul className="fm-list ka-picker-list">
            {folders.length === 0 && visibleFiles.length === 0 && (
              <li className="fm-empty">
                Folder ini kosong{q ? ' (atau tidak cocok pencarian).' : '.'}
              </li>
            )}

            {folders.map((f) => {
              const name = f.replace(prefix, '').replace(/\/$/, '')
              return (
                <li key={f} className="fm-row">
                  <button type="button" className="fm-row-main" onClick={() => setPrefix(f)}>
                    <span className="fm-icon fm-icon-folder" aria-hidden="true">冊</span>
                    <span className="fm-row-name">{name}/</span>
                  </button>
                </li>
              )
            })}

            {visibleFiles.map((item) => (
              <li key={item.key} className="fm-row fm-row-lib">
                <button type="button" className="fm-row-main fm-row-main-lib" onClick={() => onSelect(item.url)}>
                  <span className="fm-icon" aria-hidden="true">
                    {extOf(item.original_name) || '·'}
                  </span>
                  <span className="fm-row-name fm-row-name-lib">
                    {item.display_name}
                    <span className="fm-row-meta">
                      {item.file_category}
                      {!item.in_library && ' · belum di-sync'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="fm-lib-hint">
          Tidak ketemu file barunya? Upload dulu lewat{' '}
          <Link to="/admin/files" target="_blank">File Manager</Link>, atau tunggu
          beberapa saat kalau baru diunggah manual di Cloudinary.
        </p>

        <button type="button" className="ka-cancel-btn ka-picker-close" onClick={onClose}>
          Tutup
        </button>
      </div>
    </div>
  )
}
