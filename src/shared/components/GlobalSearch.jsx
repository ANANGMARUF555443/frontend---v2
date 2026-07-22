import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../features/auth/context/AuthContext'
import { kosakataApi } from '../../features/kosakata/api'
import { LETAK_LABELS } from '../constants/letak'
import './GlobalSearch.css'

// Label ramah-pengguna untuk tag part-of-speech dari Kiwi (lihat
// korean_nlp.py di backend, khususnya _KATA_ISI_TAGS & _KATA_ASING_TAGS).
// Cuma dipakai untuk tampilan -- fallback 'imbuhan' seharusnya tidak pernah
// kepakai di sini karena kita hanya menampilkan label ini untuk token yang
// bisaDicari() (is_kata_isi ATAU is_kata_asing/SL, lihat di bawah).
// "RAW" bukan tag Kiwi asli -- itu penanda dari backend (main.py, endpoint
// /kosakata/split) untuk token fallback "teks utuh apa adanya", dipakai
// waktu Kiwi memecah suatu kata (terutama kata kerja/sifat Korea yang
// konjugasinya tidak beraturan, mis. "묻다") jadi morfem batang+akhiran
// yang tidak lagi dikenali sebagai satu kata isi utuh.
const LABEL_TAG = {
  NNG: 'kata benda',
  NNP: 'nama diri',
  NNB: 'kata benda',
  VV: 'kata kerja',
  VA: 'kata sifat',
  MAG: 'kata keterangan',
  MM: 'kata penentu',
  IC: 'kata seru',
  NR: 'kata bilangan',
  NP: 'kata ganti',
  SL: 'kata asing',
  RAW: 'kata',
}

function labelForTag(tag) {
  return LABEL_TAG[tag] || 'imbuhan'
}

// Token "layak dicari" kalau Kiwi menandainya kata isi Korea (kata benda/
// kerja/sifat/dst) ATAU kata berskrip asing/Latin (tag SL -- biasanya kata
// Indonesia/Inggris yang diketik user untuk mencari padanan Korea-nya).
// Lihat korean_nlp.py di backend untuk penjelasan lengkap kenapa dua-duanya
// perlu diperlakukan sama di sini.
function bisaDicari(tok) {
  return tok.is_kata_isi || tok.is_kata_asing
}

const DEBOUNCE_MS = 450

export default function GlobalSearch() {
  const { user, token } = useAuth()

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)
  const requestIdRef = useRef(0)

  // Tutup dropdown kalau klik di luar kotak pencarian.
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Bersihkan timer debounce kalau komponen di-unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  async function runSearch(teks) {
    const trimmed = teks.trim()
    if (!trimmed) return

    const myId = ++requestIdRef.current
    setLoading(true)
    setError('')
    setOpen(true)

    try {
      const data = await kosakataApi.splitKosakata(trimmed, token)
      if (myId !== requestIdRef.current) return // ada pencarian lebih baru, abaikan hasil ini
      setResult(data)
    } catch (err) {
      if (myId !== requestIdRef.current) return
      setError(err.message || 'Gagal mencari. Coba lagi.')
      setResult(null)
    } finally {
      if (myId === requestIdRef.current) setLoading(false)
    }
  }

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!val.trim()) {
      requestIdRef.current++ // batalkan request yang mungkin masih berjalan
      setResult(null)
      setError('')
      setLoading(false)
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(() => runSearch(val), DEBOUNCE_MS)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    runSearch(query)
  }

  function handleClear() {
    requestIdRef.current++
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setQuery('')
    setResult(null)
    setError('')
    setLoading(false)
    setOpen(false)
    inputRef.current?.focus()
  }

  function handleFocus() {
    if (query.trim() && (result || error)) setOpen(true)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  function scrollToToken(idx) {
    const el = document.getElementById(`gsearch-tok-${idx}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  // Kotak pencarian butuh token login (endpoint backend butuh auth) --
  // jadi disembunyikan otomatis di halaman Login/Register, dan otomatis
  // muncul lagi begitu user login (tanpa perlu sentuh halaman lain).
  if (!user) return null

  const tokens = result?.tokens || []
  const contentTokens = tokens.filter(bisaDicari)

  return (
    <div className="gsearch-wrap" ref={wrapRef}>
      <form className="gsearch-bar" onSubmit={handleSubmit}>
        <span className="gsearch-icon" aria-hidden="true">⌕</span>
        <input
          ref={inputRef}
          type="text"
          className="gsearch-input"
          placeholder="Cari kata/kalimat Korea atau Indonesia… mis. 안녕하세요 / makan"
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          lang="ko"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            className="gsearch-clear"
            onClick={handleClear}
            aria-label="Bersihkan pencarian"
          >
            ×
          </button>
        )}
        <button type="submit" className="gsearch-submit">Cari</button>
      </form>

      {open && (
        <div className="gsearch-dropdown">
          {loading && <p className="gsearch-status">Mencari…</p>}

          {!loading && error && <p className="gsearch-error">{error}</p>}

          {!loading && !error && result && tokens.length === 0 && (
            <p className="gsearch-status">Tidak ada yang bisa dipecah dari teks ini.</p>
          )}

          {!loading && !error && result && tokens.length > 0 && (
            <>
              <div className="gsearch-tokenstrip" aria-label="Hasil pemecahan kalimat">
                {tokens.map((tok, idx) => (
                  <button
                    type="button"
                    key={idx}
                    className={`gsearch-chip ${bisaDicari(tok) ? 'is-content' : 'is-particle'}`}
                    onClick={() => bisaDicari(tok) && scrollToToken(idx)}
                    disabled={!bisaDicari(tok)}
                    title={bisaDicari(tok) ? 'Lihat arti kata ini' : 'Partikel/imbuhan gramatikal'}
                  >
                    {tok.form}
                  </button>
                ))}
              </div>

              {contentTokens.length === 0 ? (
                <p className="gsearch-status">
                  Tidak ada kata yang bisa dicari di teks ini (cuma partikel/imbuhan gramatikal).
                </p>
              ) : (
                <ul className="gsearch-results">
                  {tokens.map((tok, idx) => {
                    if (!bisaDicari(tok)) return null
                    return (
                      <li key={idx} id={`gsearch-tok-${idx}`} className="gsearch-token-section">
                        <div className="gsearch-token-head">
                          <span className="gsearch-token-form" lang="ko">{tok.form}</span>
                          <span className="gsearch-token-pos">{labelForTag(tok.tag)}</span>
                        </div>

                        {tok.matches.length === 0 ? (
                          <p className="gsearch-nomatch">Belum ada di kamus.</p>
                        ) : (
                          <ul className="gsearch-matches">
                            {tok.matches.map((m) => (
                              <li key={m.id} className="gsearch-card">
                                <div className="gsearch-card-top">
                                  <p className="gsearch-card-korean" lang="ko">{m.korean_text}</p>
                                  <span className="gsearch-card-tag">
                                    Bab {m.bab} · {LETAK_LABELS[m.letak] || m.letak}
                                  </span>
                                </div>
                                {m.indonesian_text && (
                                  <p className="gsearch-card-id">{m.indonesian_text}</p>
                                )}
                                {m.english_text && (
                                  <p className="gsearch-card-en">{m.english_text}</p>
                                )}
                                {m.key_point && (
                                  <p className="gsearch-card-kp">★ {m.key_point}</p>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}

                        {tok.total_matches > tok.matches.length && (
                          <p className="gsearch-more">
                            +{tok.total_matches - tok.matches.length} entri lain untuk kata ini.
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
