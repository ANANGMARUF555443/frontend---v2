import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../auth/context/AuthContext'
import { gameApi } from '../../api'
import { kosakataApi } from '../../../kosakata/api'
import { LETAK_LIST, BAB_COUNT } from '../../../../shared/constants/letak'
import '../../../../shared/styles/Auth.css'
import '../../../dashboard/pages/Dashboard.css'
import './AcakKataGame.css'

// Tahapan wizard, berurutan:
//   setting  -> pilih mode (contoh/acak) dari game_setting_hafalan
//   pilih    -> pilih bab & letak
//   tandai   -> pilih kosakata mana saja yang jadi bank soal (LOKAL saja, tanpa API call per klik)
//   main     -> soal muncul satu-satu dengan timer per soal
//   hasil    -> ringkasan poin setelah sesi selesai
const STEP = { SETTING: 'setting', PILIH: 'pilih', TANDAI: 'tandai', MAIN: 'main', HASIL: 'hasil' }

export default function AcakKataGame() {
  const { token } = useAuth()

  const [step, setStep] = useState(STEP.SETTING)
  const [error, setError] = useState('')

  // ── Langkah 1: setting (mode) ────────────────────────────────────
  const [settings, setSettings] = useState([])
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [selectedSetting, setSelectedSetting] = useState(null)

  useEffect(() => {
    api
      .listGameSettingHafalan(token)
      .then((data) => setSettings(data.filter((s) => s.aktif)))
      .catch((err) => setError(err.message || 'Gagal memuat setting game.'))
      .finally(() => setSettingsLoading(false))
  }, [token])

  // ── Langkah 2: bab & letak ────────────────────────────────────────
  const [bab, setBab] = useState(1)
  const [letak, setLetak] = useState(LETAK_LIST[0].key)

  // ── Sesi aktif (header game_acak_kata) ────────────────────────────
  const [sesi, setSesi] = useState(null)
  const [creatingSesi, setCreatingSesi] = useState(false)

  // ── Langkah 3: kosakata bab+letak & pilihan (LOKAL, belum dikirim ke server) ──
  const [kosakataList, setKosakataList] = useState([])
  const [kosakataLoading, setKosakataLoading] = useState(false)
  const [markedIds, setMarkedIds] = useState(() => new Set())
  const [starting, setStarting] = useState(false)

  // ── Langkah 4: main ────────────────────────────────────────────────
  const [soalList, setSoalList] = useState([]) // array GameAcakKataDetailOut, urut acak
  const [soalIndex, setSoalIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [jawabanTerkirim, setJawabanTerkirim] = useState(false)
  const timerRef = useRef(null)

  // ── Langkah 5: hasil ───────────────────────────────────────────────
  const [hasil, setHasil] = useState(null) // { poin_didapat, poin_total_user }
  const [finishing, setFinishing] = useState(false)

  function resetKeAwal() {
    setStep(STEP.SETTING)
    setError('')
    setSelectedSetting(null)
    setSesi(null)
    setKosakataList([])
    setMarkedIds(new Set())
    setSoalList([])
    setSoalIndex(0)
    setHasil(null)
  }

  // ── Pilih mode setting, lanjut ke pilih bab/letak ─────────────────
  function pilihSetting(setting) {
    setSelectedSetting(setting)
    setError('')
    setStep(STEP.PILIH)
  }

  // ── Buat sesi baru (POST /game/acak-kata), lalu muat kosakata bab+letak ──
  async function mulaiPilihKosakata() {
    setError('')
    setCreatingSesi(true)
    try {
      const sesiBaru = await gameApi.buatGameAcakKata(
        { idSettingGame: selectedSetting.id, bab, letak },
        token
      )
      setSesi(sesiBaru)

      setKosakataLoading(true)
      const items = await kosakataApi.listKosakata(token, { bab, letak })
      setKosakataList(items)
      setMarkedIds(new Set())
      setStep(STEP.TANDAI)
    } catch (err) {
      setError(err.message || 'Gagal membuat sesi game. Pastikan bab & letak yang dipilih punya kosakata.')
    } finally {
      setCreatingSesi(false)
      setKosakataLoading(false)
    }
  }

  // ── Toggle pilih 1 kosakata (LOKAL SAJA, tidak ada API call) ──────
  function toggleTandai(kosakataId) {
    setMarkedIds((prev) => {
      const next = new Set(prev)
      if (next.has(kosakataId)) {
        next.delete(kosakataId)
      } else {
        next.add(kosakataId)
      }
      return next
    })
  }

  const jumlahSoalDibutuhkan = selectedSetting?.jumlah_soal ?? 0
  const cukupDitandai = markedIds.size >= jumlahSoalDibutuhkan

  // ── Mulai main: kirim SEMUA kosakata_ids yang dipilih sekaligus ───
  async function mulaiMain() {
    setError('')
    setStarting(true)
    try {
      const sesiSiap = await gameApi.mulaiGameAcakKata(sesi.id, Array.from(markedIds), token)
      setSesi(sesiSiap)

      // sesiSiap.detail sudah berisi semua kosakata yang baru saja dikirim
      const dipilih = shuffle(sesiSiap.detail).slice(0, jumlahSoalDibutuhkan)

      setSoalList(dipilih)
      setSoalIndex(0)
      setJawabanTerkirim(false)
      setStep(STEP.MAIN)
    } catch (err) {
      setError(err.message || 'Gagal memulai permainan.')
    } finally {
      setStarting(false)
    }
  }

  // ── Timer per soal ──────────────────────────────────────────────
  const durasi = selectedSetting?.durasi_detik ?? 10
  const soalSekarang = soalList[soalIndex]

  useEffect(() => {
    if (step !== STEP.MAIN || !soalSekarang) return
    setTimeLeft(durasi)
    setJawabanTerkirim(false)

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soalIndex, step])

  // Waktu habis tanpa dijawab -> otomatis skip (dianggap tidak benar)
  useEffect(() => {
    if (step !== STEP.MAIN) return
    if (timeLeft === 0 && !jawabanTerkirim) {
      submitJawaban(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  async function submitJawaban(benar) {
    if (jawabanTerkirim || !soalSekarang) return
    setJawabanTerkirim(true)
    clearInterval(timerRef.current)
    try {
      await gameApi.jawabSoalAcakKata(sesi.id, soalSekarang.kosakata_id, benar, token)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan jawaban, lanjut ke soal berikutnya.')
    }

    setTimeout(() => {
      if (soalIndex + 1 < soalList.length) {
        setSoalIndex((i) => i + 1)
      } else {
        selesaikanSesi()
      }
    }, 400)
  }

  async function selesaikanSesi() {
    setFinishing(true)
    setError('')
    try {
      const result = await gameApi.selesaikanGameAcakKata(sesi.id, token)
      setHasil(result)
      setStep(STEP.HASIL)
    } catch (err) {
      setError(err.message || 'Gagal menyelesaikan sesi.')
    } finally {
      setFinishing(false)
    }
  }

  return (
    <div className="placeholder-page acak-kata-page">
      <Link className="back-link" to="/quiz">&larr; Kembali ke Quiz</Link>
      <h1>Acak Kata</h1>

      {error && <p className="acak-kata-error">{error}</p>}

      {step === STEP.SETTING && (
        <StepSetting
          loading={settingsLoading}
          settings={settings}
          onPilih={pilihSetting}
        />
      )}

      {step === STEP.PILIH && (
        <StepPilihBabLetak
          bab={bab}
          setBab={setBab}
          letak={letak}
          setLetak={setLetak}
          setting={selectedSetting}
          creating={creatingSesi}
          onLanjut={mulaiPilihKosakata}
          onBatal={() => setStep(STEP.SETTING)}
        />
      )}

      {step === STEP.TANDAI && (
        <StepTandai
          loading={kosakataLoading}
          items={kosakataList}
          markedIds={markedIds}
          onToggle={toggleTandai}
          jumlahDibutuhkan={jumlahSoalDibutuhkan}
          cukup={cukupDitandai}
          starting={starting}
          onMulai={mulaiMain}
          onBatal={() => setStep(STEP.PILIH)}
        />
      )}

      {step === STEP.MAIN && soalSekarang && (
        <StepMain
          soal={soalSekarang}
          nomor={soalIndex + 1}
          total={soalList.length}
          timeLeft={timeLeft}
          durasi={durasi}
          jawabanTerkirim={jawabanTerkirim}
          onJawab={submitJawaban}
        />
      )}

      {step === STEP.HASIL && hasil && (
        <StepHasil hasil={hasil} totalSoal={soalList.length} onMainLagi={resetKeAwal} />
      )}
    </div>
  )
}

// Fisher-Yates sederhana, cukup untuk mengacak urutan soal di sisi klien.
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Sub-komponen tiap langkah ────────────────────────────────────────

function StepSetting({ loading, settings, onPilih }) {
  if (loading) return <p className="status-line">Memuat mode permainan…</p>
  if (settings.length === 0) {
    return <p className="status-line">Belum ada mode permainan yang aktif. Hubungi admin.</p>
  }
  return (
    <div className="acak-kata-step">
      <p className="acak-kata-step-desc">Pilih mode permainan.</p>
      <div className="acak-kata-setting-grid">
        {settings.map((s) => (
          <button key={s.id} className="acak-kata-setting-card" onClick={() => onPilih(s)}>
            <span className="acak-kata-setting-label">{s.nama_label}</span>
            <span className="acak-kata-setting-meta">{s.jumlah_soal} soal · {s.durasi_detik} detik/soal</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepPilihBabLetak({ bab, setBab, letak, setLetak, setting, creating, onLanjut, onBatal }) {
  const babOptions = useMemo(() => Array.from({ length: BAB_COUNT }, (_, i) => i + 1), [])
  return (
    <div className="acak-kata-step">
      <p className="acak-kata-step-desc">
        Mode <strong>{setting.nama_label}</strong> — {setting.jumlah_soal} soal, {setting.durasi_detik} detik/soal.
      </p>

      <label className="acak-kata-field">
        <span>Bab</span>
        <select value={bab} onChange={(e) => setBab(Number(e.target.value))}>
          {babOptions.map((n) => (
            <option key={n} value={n}>Bab {n}</option>
          ))}
        </select>
      </label>

      <label className="acak-kata-field">
        <span>Letak</span>
        <select value={letak} onChange={(e) => setLetak(e.target.value)}>
          {LETAK_LIST.map((l) => (
            <option key={l.key} value={l.key}>{l.label}</option>
          ))}
        </select>
      </label>

      <div className="acak-kata-actions">
        <button className="btn-secondary" onClick={onBatal}>Kembali</button>
        <button className="btn-primary" onClick={onLanjut} disabled={creating}>
          {creating ? 'Menyiapkan…' : 'Lanjut'}
        </button>
      </div>
    </div>
  )
}

function StepTandai({ loading, items, markedIds, onToggle, jumlahDibutuhkan, cukup, starting, onMulai, onBatal }) {
  if (loading) return <p className="status-line">Memuat kosakata…</p>
  if (items.length === 0) {
    return (
      <div className="acak-kata-step">
        <p className="status-line">Tidak ada kosakata pada bab & letak ini.</p>
        <button className="btn-secondary" onClick={onBatal}>Kembali</button>
      </div>
    )
  }

  return (
    <div className="acak-kata-step">
      <p className="acak-kata-step-desc">
        Tandai kosakata yang mau dijadikan soal. Ditandai: <strong>{markedIds.size}</strong> / minimal {jumlahDibutuhkan}.
      </p>

      <div className="acak-kata-kosakata-list">
        {items.map((item) => {
          const marked = markedIds.has(item.id)
          return (
            <button
              key={item.id}
              className={`acak-kata-kosakata-item${marked ? ' acak-kata-kosakata-item--marked' : ''}`}
              onClick={() => onToggle(item.id)}
            >
              <span className="acak-kata-kosakata-korean">{item.korean_text}</span>
              {item.indonesian_text && (
                <span className="acak-kata-kosakata-arti">{item.indonesian_text}</span>
              )}
              <span className="acak-kata-kosakata-check">{marked ? '✓' : '+'}</span>
            </button>
          )
        })}
      </div>

      <div className="acak-kata-actions">
        <button className="btn-secondary" onClick={onBatal}>Kembali</button>
        <button className="btn-primary" onClick={onMulai} disabled={!cukup || starting}>
          {starting ? 'Memulai…' : 'Mulai Main'}
        </button>
      </div>
    </div>
  )
}

function StepMain({ soal, nomor, total, timeLeft, durasi, jawabanTerkirim, onJawab }) {
  const kosakata = soal.kosakata
  const persen = Math.max(0, Math.round((timeLeft / durasi) * 100))

  return (
    <div className="acak-kata-step acak-kata-main">
      <div className="acak-kata-progress">Soal {nomor} / {total}</div>

      <div className="acak-kata-timer-track">
        <div className="acak-kata-timer-fill" style={{ width: `${persen}%` }} />
      </div>
      <div className="acak-kata-timer-label">{timeLeft} detik</div>

      <div className="acak-kata-soal-card">
        <span className="acak-kata-soal-korean">{kosakata?.korean_text}</span>
      </div>

      <p className="acak-kata-step-desc">Apakah kamu tahu artinya?</p>

      <div className="acak-kata-actions">
        <button className="btn-secondary" onClick={() => onJawab(false)} disabled={jawabanTerkirim}>
          Tidak Tahu
        </button>
        <button className="btn-primary" onClick={() => onJawab(true)} disabled={jawabanTerkirim}>
          Saya Tahu
        </button>
      </div>

      {kosakata?.indonesian_text && jawabanTerkirim && (
        <p className="acak-kata-jawaban-reveal">Arti: {kosakata.indonesian_text}</p>
      )}
    </div>
  )
}

function StepHasil({ hasil, totalSoal, onMainLagi }) {
  return (
    <div className="acak-kata-step acak-kata-hasil">
      <p className="acak-kata-hasil-skor">
        {hasil.poin_didapat} / {totalSoal}
      </p>
      <p className="acak-kata-step-desc">Soal terjawab benar. Poin sudah ditambahkan ke akunmu.</p>
      <p className="acak-kata-hasil-total">Total poin kamu sekarang: <strong>{hasil.poin_total_user}</strong></p>

      <div className="acak-kata-actions">
        <button className="btn-primary" onClick={onMainLagi}>Main Lagi</button>
      </div>
    </div>
  )
}
