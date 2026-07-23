import { useCallback, useEffect, useRef, useState } from 'react'
import './PlayerGame1.css'

export default function PlayerGame1({ sesi, onSelesai, onBatal }) {
  const totalSoal = sesi.soal.length
  const [indeks, setIndeks] = useState(0)
  const [dipilih, setDipilih] = useState(null)
  const [terkunci, setTerkunci] = useState(false)
  const [sisaDetik, setSisaDetik] = useState(sesi.durasi_per_soal_detik)
  const jawabanRef = useRef([])
  const mulaiSoalRef = useRef(Date.now())
  const selesaiDikirimRef = useRef(false)

  const soalSaatIni = sesi.soal[indeks]

  const lanjutKeSoalBerikutnya = useCallback(
    (idKosakataDipilih) => {
      const waktuDetik = (Date.now() - mulaiSoalRef.current) / 1000
      jawabanRef.current.push({
        kosakata_id: soalSaatIni.kosakata_id,
        id_kosakata_dipilih: idKosakataDipilih,
        waktu_jawab_detik: Number(waktuDetik.toFixed(2)),
      })

      if (indeks + 1 >= totalSoal) {
        if (!selesaiDikirimRef.current) {
          selesaiDikirimRef.current = true
          onSelesai(jawabanRef.current)
        }
        return
      }
      setIndeks((i) => i + 1)
      setDipilih(null)
      setTerkunci(false)
      setSisaDetik(sesi.durasi_per_soal_detik)
      mulaiSoalRef.current = Date.now()
    },
    [indeks, totalSoal, soalSaatIni, onSelesai, sesi.durasi_per_soal_detik]
  )

  useEffect(() => {
    if (terkunci) return
    if (sisaDetik <= 0) {
      lanjutKeSoalBerikutnya(null)
      return
    }
    const t = setTimeout(() => setSisaDetik((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [sisaDetik, terkunci])

  function pilihJawaban(kosakataIdOpsi) {
    if (terkunci) return
    setDipilih(kosakataIdOpsi)
    setTerkunci(true)
    setTimeout(() => lanjutKeSoalBerikutnya(kosakataIdOpsi), 550)
  }

  const persenWaktu = Math.max(0, (sisaDetik / sesi.durasi_per_soal_detik) * 100)
  const waktuKritis = sisaDetik <= Math.ceil(sesi.durasi_per_soal_detik * 0.2)

  return (
    <div className="game1-player">
      <div className="game1-player-head">
        <button type="button" className="game1-exit-btn" onClick={onBatal}>
          &larr; Keluar
        </button>
        <span className="game1-progress-text">
          Soal {indeks + 1} / {totalSoal}
        </span>
      </div>

      <div className="game1-timer-bar-wrap">
        <div
          className={`game1-timer-bar ${waktuKritis ? 'is-critical' : ''}`}
          style={{ width: `${persenWaktu}%` }}
        />
      </div>
      <div className="game1-timer-detik">{sisaDetik}s</div>

      <div className="game1-soal-card">
        <p className="game1-soal-teks">{soalSaatIni.teks_soal}</p>
      </div>

      <div
        className={`game1-opsi-grid game1-opsi-grid--${sesi.jumlah_pilihan_jawaban}`}
      >
        {soalSaatIni.opsi.map((opsi) => {
          let kelas = 'game1-opsi'
          if (terkunci) {
            if (opsi.kosakata_id === soalSaatIni.kosakata_id) kelas += ' is-benar'
            else if (opsi.kosakata_id === dipilih) kelas += ' is-salah'
          }
          return (
            <button
              key={opsi.kosakata_id}
              type="button"
              className={kelas}
              disabled={terkunci}
              onClick={() => pilihJawaban(opsi.kosakata_id)}
            >
              {opsi.teks}
            </button>
          )
        })}
      </div>
    </div>
  )
}