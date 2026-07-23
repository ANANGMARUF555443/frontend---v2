import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../auth/context/AuthContext'
import { kosakataApi } from '../../../kosakata/api'

const JENIS_GAME_LABEL = {
  per_kata: 'Per Kata',
  per_letak: 'Per Letak',
  per_bab: 'Per Bab',
  campuran: 'Campuran',
}

const JENIS_GAME_DESC = {
  per_kata: 'Pilih bab, lalu letak -- semua kosakata di dalamnya tampil, tandai satu-satu yang mau jadi soal.',
  per_letak: 'Pilih satu bab, lalu satu atau beberapa letak di dalamnya sebagai sumber soal.',
  per_bab: 'Pilih satu bab -- semua kosakata di bab itu jadi sumber soal.',
  campuran: 'Pilih sendiri kosakata dari tanda hafalanmu, lintas bab & letak.',
}

const MODE_WAKTU_LABEL = {
  normal: 'Normal',
  cepat: 'Cepat',
  super_cepat: 'Super Cepat',
}

const LEVEL_LABEL = {
  biasa: 'Biasa',
  menantang: 'Menantang',
  master: 'Master',
}

function emptyForm(meta) {
  return {
    jenis_game: 'per_bab',
    jumlah_soal: meta?.jumlah_soal_choices?.[0] ?? 10,
    mode_waktu: 'normal',
    level_pilihan_ganda: 'biasa',
    tipe_soal: 'korea_ke_indonesia',
    bab_dipilih: 1,
    letak_ditandai: [],
    id_kosakata_ditandai: [],
  }
}

export default function SetupGame1({ meta, presetList, tandaiList, onMulai, onSimpanPreset, onHapusPreset, onCekKetersediaan, onExit }) {
  const { token } = useAuth()
  const [form, setForm] = useState(() => emptyForm(meta))
  const [presetTerpilih, setPresetTerpilih] = useState('') // '' = ad-hoc, else id preset
  const [ketersediaan, setKetersediaan] = useState(null) // { jumlah_tersedia, opsi_jumlah_soal }
  const [mengecek, setMengecek] = useState(false)
  const [memulai, setMemulai] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [namaPresetBaru, setNamaPresetBaru] = useState('')
  const [simpanTerbuka, setSimpanTerbuka] = useState(false)

  // ── per_kata: bab -> letak -> daftar kosakata di bab+letak itu ──────
  // Centang di sini murni state lokal (tidak memanggil endpoint tandai
  // sama sekali) -- hanya dikirim sebagai id_kosakata_ditandai sekali,
  // saat user menekan "Mulai".
  const [letakPerKataAktif, setLetakPerKataAktif] = useState('')
  const [daftarKosakataPerKata, setDaftarKosakataPerKata] = useState([])
  const [memuatKosakataPerKata, setMemuatKosakataPerKata] = useState(false)
  const [errorKosakataPerKata, setErrorKosakataPerKata] = useState('')

  useEffect(() => {
    if (!letakPerKataAktif && meta?.letak_choices?.length > 0) {
      setLetakPerKataAktif(meta.letak_choices[0].key)
    }
  }, [meta, letakPerKataAktif])

  // Ambil ulang daftar kosakata setiap kali bab/letak aktif untuk per_kata
  // berubah. Pilihan centang direset (letak/bab baru = mulai bersih).
  useEffect(() => {
    if (form.jenis_game !== 'per_kata' || !letakPerKataAktif) return
    let batal = false
    setMemuatKosakataPerKata(true)
    setErrorKosakataPerKata('')
    kosakataApi
      .listKosakata(token, { bab: form.bab_dipilih, letak: letakPerKataAktif })
      .then((data) => {
        if (batal) return
        setDaftarKosakataPerKata(data)
        setForm((f) => ({ ...f, id_kosakata_ditandai: [] }))
      })
      .catch((err) => {
        if (batal) return
        setErrorKosakataPerKata(err.message || 'Gagal memuat kosakata.')
        setDaftarKosakataPerKata([])
      })
      .finally(() => {
        if (!batal) setMemuatKosakataPerKata(false)
      })
    return () => { batal = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.jenis_game, form.bab_dipilih, letakPerKataAktif, token])

  function toggleKosakataPerKata(id) {
    setForm((f) => {
      const ada = f.id_kosakata_ditandai.includes(id)
      const next = ada ? f.id_kosakata_ditandai.filter((x) => x !== id) : [...f.id_kosakata_ditandai, id]
      return { ...f, id_kosakata_ditandai: next }
    })
  }

  function tandaiSemuaPerKata() {
    setForm((f) => ({ ...f, id_kosakata_ditandai: daftarKosakataPerKata.map((k) => k.id) }))
  }

  function batalSemuaPerKata() {
    setForm((f) => ({ ...f, id_kosakata_ditandai: [] }))
  }

  function updateForm(patch) {
    setForm((f) => ({ ...f, ...patch }))
    setKetersediaan(null)
  }

  function terapkanPreset(idStr) {
    setPresetTerpilih(idStr)
    setKetersediaan(null)
    if (!idStr) return
    const preset = presetList.find((p) => String(p.id) === idStr)
    if (!preset) return
    setForm((f) => ({
      ...f,
      jenis_game: preset.jenis_game,
      jumlah_soal: preset.jumlah_soal,
      mode_waktu: preset.mode_waktu,
      level_pilihan_ganda: preset.level_pilihan_ganda,
      tipe_soal: preset.tipe_soal,
    }))
  }

  function toggleLetak(key) {
    setForm((f) => {
      const ada = f.letak_ditandai.includes(key)
      const next = ada ? f.letak_ditandai.filter((k) => k !== key) : [...f.letak_ditandai, key]
      return { ...f, letak_ditandai: next }
    })
    setKetersediaan(null)
  }

  function toggleKosakataCampuran(id) {
    setForm((f) => {
      const ada = f.id_kosakata_ditandai.includes(id)
      const next = ada ? f.id_kosakata_ditandai.filter((x) => x !== id) : [...f.id_kosakata_ditandai, id]
      return { ...f, id_kosakata_ditandai: next }
    })
    setKetersediaan(null)
  }

  const payloadKetersediaan = useMemo(() => {
    const base = { jenis_game: form.jenis_game }
    if (form.jenis_game === 'per_kata' || form.jenis_game === 'campuran') {
      base.id_kosakata_ditandai = form.id_kosakata_ditandai
    }
    if (form.jenis_game === 'per_letak') {
      base.bab_dipilih = form.bab_dipilih
      base.letak_ditandai = form.letak_ditandai
    }
    if (form.jenis_game === 'per_bab') {
      base.bab_dipilih = form.bab_dipilih
    }
    return base
  }, [form])

  async function cekKetersediaan() {
    setErrorMsg('')
    setMengecek(true)
    try {
      const data = await onCekKetersediaan(payloadKetersediaan)
      setKetersediaan(data)
      // Kalau jumlah_soal saat ini sudah tidak aktif, pindah ke opsi aktif pertama.
      const opsiAktif = data.opsi_jumlah_soal.find((o) => o.aktif)
      const jumlahSaatIniAktif = data.opsi_jumlah_soal.find((o) => o.jumlah_soal === form.jumlah_soal)?.aktif
      if (!jumlahSaatIniAktif && opsiAktif) {
        setForm((f) => ({ ...f, jumlah_soal: opsiAktif.jumlah_soal }))
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengecek ketersediaan.')
    } finally {
      setMengecek(false)
    }
  }

  function validasiSebelumMulai() {
    if (form.jenis_game === 'per_kata' && form.id_kosakata_ditandai.length === 0) {
      return 'Tandai minimal 1 kosakata dari daftar di atas.'
    }
    if (form.jenis_game === 'per_letak' && form.letak_ditandai.length === 0) {
      return 'Pilih minimal 1 letak.'
    }
    if (form.jenis_game === 'campuran' && form.id_kosakata_ditandai.length === 0) {
      return 'Pilih minimal 1 kosakata dari daftar tandaimu.'
    }
    return ''
  }

  async function handleMulai() {
    const v = validasiSebelumMulai()
    if (v) {
      setErrorMsg(v)
      return
    }
    setErrorMsg('')
    setMemulai(true)
    try {
      const payload = { id_setting_game1: presetTerpilih ? Number(presetTerpilih) : null }
      if (!presetTerpilih) {
        payload.jumlah_soal = form.jumlah_soal
        payload.mode_waktu = form.mode_waktu
        payload.level_pilihan_ganda = form.level_pilihan_ganda
        payload.tipe_soal = form.tipe_soal
        payload.jenis_game = form.jenis_game
      }
      if (form.jenis_game === 'per_kata' || form.jenis_game === 'campuran') {
        payload.id_kosakata_ditandai = form.id_kosakata_ditandai
      }
      if (form.jenis_game === 'per_letak') {
        payload.bab_dipilih = form.bab_dipilih
        payload.letak_ditandai = form.letak_ditandai
      }
      if (form.jenis_game === 'per_bab') {
        payload.bab_dipilih = form.bab_dipilih
      }
      await onMulai(payload)
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memulai sesi.')
    } finally {
      setMemulai(false)
    }
  }

  async function handleSimpanPreset() {
    if (!namaPresetBaru.trim()) return
    try {
      await onSimpanPreset({
        nama_setting: namaPresetBaru.trim(),
        jumlah_soal: form.jumlah_soal,
        mode_waktu: form.mode_waktu,
        level_pilihan_ganda: form.level_pilihan_ganda,
        tipe_soal: form.tipe_soal,
        jenis_game: form.jenis_game,
      })
      setNamaPresetBaru('')
      setSimpanTerbuka(false)
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan preset.')
    }
  }

  if (!meta) return null

  return (
    <div className="game1-setup">
      <div className="game1-setup-head">
        <button type="button" className="game1-exit-btn" onClick={onExit}>&larr; Kembali ke Quiz</button>
        <h1 className="game1-title">Game 1 -- Susun Setelan</h1>
      </div>

      {/* Preset tersimpan */}
      {presetList.length > 0 && (
        <section className="game1-block">
          <h2 className="game1-block-title">Preset tersimpan</h2>
          <div className="game1-preset-list">
            <button
              type="button"
              className={`game1-preset-chip ${presetTerpilih === '' ? 'is-active' : ''}`}
              onClick={() => terapkanPreset('')}
            >
              Ad-hoc (tanpa preset)
            </button>
            {presetList.map((p) => (
              <div key={p.id} className={`game1-preset-chip-wrap ${presetTerpilih === String(p.id) ? 'is-active' : ''}`}>
                <button type="button" className="game1-preset-chip" onClick={() => terapkanPreset(String(p.id))}>
                  {p.nama_setting || `Preset #${p.id}`}
                </button>
                <button
                  type="button"
                  className="game1-preset-remove"
                  title="Hapus preset"
                  onClick={() => onHapusPreset(p.id)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Jenis Game */}
      <section className="game1-block">
        <h2 className="game1-block-title">Jenis Game</h2>
        <div className="game1-option-grid">
          {meta.jenis_game_choices.map((jg) => (
            <button
              key={jg}
              type="button"
              className={`game1-option-card ${form.jenis_game === jg ? 'is-active' : ''}`}
              onClick={() => updateForm({ jenis_game: jg })}
            >
              <span className="game1-option-title">{JENIS_GAME_LABEL[jg] || jg}</span>
              <span className="game1-option-desc">{JENIS_GAME_DESC[jg]}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Parameter khusus jenis_game */}
      {(form.jenis_game === 'per_kata' || form.jenis_game === 'per_letak' || form.jenis_game === 'per_bab') && (
        <section className="game1-block">
          <h2 className="game1-block-title">Pilih Bab</h2>
          <div className="game1-bab-nav">
            <button type="button" disabled={form.bab_dipilih <= 1} onClick={() => updateForm({ bab_dipilih: form.bab_dipilih - 1 })}>&lsaquo;</button>
            <select value={form.bab_dipilih} onChange={(e) => updateForm({ bab_dipilih: Number(e.target.value) })}>
              {Array.from({ length: meta.bab_count }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>Bab {n} / {meta.bab_count}</option>
              ))}
            </select>
            <button type="button" disabled={form.bab_dipilih >= meta.bab_count} onClick={() => updateForm({ bab_dipilih: form.bab_dipilih + 1 })}>&rsaquo;</button>
          </div>
        </section>
      )}

      {form.jenis_game === 'per_kata' && (
        <>
          <section className="game1-block">
            <h2 className="game1-block-title">Pilih Letak</h2>
            <div className="game1-chip-row">
              {meta.letak_choices.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  className={`game1-chip ${letakPerKataAktif === l.key ? 'is-active' : ''}`}
                  onClick={() => setLetakPerKataAktif(l.key)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </section>

          <section className="game1-block">
            <h2 className="game1-block-title">
              Tandai kosakata ({form.id_kosakata_ditandai.length}/{daftarKosakataPerKata.length} dipilih)
            </h2>
            {memuatKosakataPerKata && <p className="game1-hint">Memuat kosakata...</p>}
            {errorKosakataPerKata && <p className="game1-error">{errorKosakataPerKata}</p>}
            {!memuatKosakataPerKata && !errorKosakataPerKata && (
              daftarKosakataPerKata.length === 0 ? (
                <p className="game1-hint">Tidak ada kosakata di bab &amp; letak ini.</p>
              ) : (
                <>
                  <div className="game1-tandai-actions">
                    <button type="button" className="game1-link-btn" onClick={tandaiSemuaPerKata}>Tandai semua</button>
                    <button type="button" className="game1-link-btn" onClick={batalSemuaPerKata}>Batal semua</button>
                  </div>
                  <div className="game1-kosakata-pick-list">
                    {daftarKosakataPerKata.map((k) => (
                      <button
                        key={k.id}
                        type="button"
                        className={`game1-kosakata-pick ${form.id_kosakata_ditandai.includes(k.id) ? 'is-active' : ''}`}
                        onClick={() => toggleKosakataPerKata(k.id)}
                      >
                        <span className="game1-kosakata-pick-ko">{k.korean_text}</span>
                        <span className="game1-kosakata-pick-id">{k.indonesian_text}</span>
                      </button>
                    ))}
                  </div>
                </>
              )
            )}
          </section>
        </>
      )}

      {form.jenis_game === 'per_letak' && (
        <section className="game1-block">
          <h2 className="game1-block-title">
            Pilih letak ({form.letak_ditandai.length}/{meta.maks_letak_ditandai})
          </h2>
          <div className="game1-chip-row">
            {meta.letak_choices.map((l) => (
              <button
                key={l.key}
                type="button"
                className={`game1-chip ${form.letak_ditandai.includes(l.key) ? 'is-active' : ''}`}
                onClick={() => toggleLetak(l.key)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {form.jenis_game === 'campuran' && (
        <section className="game1-block">
          <h2 className="game1-block-title">
            Pilih kosakata tertandai ({form.id_kosakata_ditandai.length} dipilih)
          </h2>
          {tandaiList.length === 0 ? (
            <p className="game1-hint">Belum ada kosakata yang ditandai. Tandai dulu di halaman Kosakata.</p>
          ) : (
            <div className="game1-kosakata-pick-list">
              {tandaiList.map((t) => t.kosakata && (
                <button
                  key={t.kosakata.id}
                  type="button"
                  className={`game1-kosakata-pick ${form.id_kosakata_ditandai.includes(t.kosakata.id) ? 'is-active' : ''}`}
                  onClick={() => toggleKosakataCampuran(t.kosakata.id)}
                >
                  <span className="game1-kosakata-pick-ko">{t.kosakata.korean_text}</span>
                  <span className="game1-kosakata-pick-id">{t.kosakata.indonesian_text}</span>
                  <span className="game1-kosakata-pick-meta">Bab {t.kosakata.bab}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Parameter umum (disembunyikan kalau pakai preset) */}
      {!presetTerpilih && (
        <>
          <section className="game1-block">
            <h2 className="game1-block-title">Tipe Soal</h2>
            <div className="game1-chip-row">
              <button
                type="button"
                className={`game1-chip ${form.tipe_soal === 'korea_ke_indonesia' ? 'is-active' : ''}`}
                onClick={() => updateForm({ tipe_soal: 'korea_ke_indonesia' })}
              >
                Korea &rarr; Indonesia
              </button>
              <button
                type="button"
                className={`game1-chip ${form.tipe_soal === 'indonesia_ke_korea' ? 'is-active' : ''}`}
                onClick={() => updateForm({ tipe_soal: 'indonesia_ke_korea' })}
              >
                Indonesia &rarr; Korea
              </button>
            </div>
          </section>

          <section className="game1-block">
            <h2 className="game1-block-title">Mode Waktu</h2>
            <div className="game1-chip-row">
              {Object.keys(meta.mode_waktu_choices).map((mw) => (
                <button
                  key={mw}
                  type="button"
                  className={`game1-chip ${form.mode_waktu === mw ? 'is-active' : ''}`}
                  onClick={() => updateForm({ mode_waktu: mw })}
                >
                  {MODE_WAKTU_LABEL[mw] || mw} ({meta.mode_waktu_choices[mw]}s/soal)
                </button>
              ))}
            </div>
          </section>

          <section className="game1-block">
            <h2 className="game1-block-title">Level Pilihan Ganda</h2>
            <div className="game1-chip-row">
              {Object.keys(meta.level_pilihan_ganda_choices).map((lv) => (
                <button
                  key={lv}
                  type="button"
                  className={`game1-chip ${form.level_pilihan_ganda === lv ? 'is-active' : ''}`}
                  onClick={() => updateForm({ level_pilihan_ganda: lv })}
                >
                  {LEVEL_LABEL[lv] || lv} ({meta.level_pilihan_ganda_choices[lv]} opsi)
                </button>
              ))}
            </div>
          </section>

          {form.jenis_game !== 'per_kata' && (
            <section className="game1-block">
              <h2 className="game1-block-title">Jumlah Soal</h2>
              <div className="game1-chip-row">
                {meta.jumlah_soal_choices.map((n) => {
                  const opsi = ketersediaan?.opsi_jumlah_soal?.find((o) => o.jumlah_soal === n)
                  const nonaktif = ketersediaan ? !opsi?.aktif : false
                  return (
                    <button
                      key={n}
                      type="button"
                      disabled={nonaktif}
                      className={`game1-chip ${form.jumlah_soal === n ? 'is-active' : ''}`}
                      onClick={() => updateForm({ jumlah_soal: n })}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
              <button type="button" className="game1-link-btn" onClick={cekKetersediaan} disabled={mengecek}>
                {mengecek ? 'Mengecek...' : 'Cek ketersediaan soal'}
              </button>
              {ketersediaan && (
                <p className="game1-hint">{ketersediaan.jumlah_tersedia} kosakata tersedia untuk kombinasi ini.</p>
              )}
            </section>
          )}

          <section className="game1-block">
            {simpanTerbuka ? (
              <div className="game1-save-preset-row">
                <input
                  type="text"
                  placeholder="Nama preset"
                  value={namaPresetBaru}
                  onChange={(e) => setNamaPresetBaru(e.target.value)}
                  className="game1-input"
                />
                <button type="button" className="game1-btn-secondary" onClick={handleSimpanPreset}>Simpan</button>
                <button type="button" className="game1-link-btn" onClick={() => setSimpanTerbuka(false)}>Batal</button>
              </div>
            ) : (
              <button type="button" className="game1-link-btn" onClick={() => setSimpanTerbuka(true)}>
                Simpan setelan ini sebagai preset
              </button>
            )}
          </section>
        </>
      )}

      {errorMsg && <p className="game1-error">{errorMsg}</p>}

      <button type="button" className="game1-btn-primary game1-btn-mulai" onClick={handleMulai} disabled={memulai}>
        {memulai ? 'Menyiapkan soal...' : 'Mulai'}
      </button>
    </div>
  )
}
