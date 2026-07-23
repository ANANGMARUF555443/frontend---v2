export default function ResultGame1({ hasil, sesi, onMainLagi, onExit }) {
  const total = hasil.jumlah_benar + hasil.jumlah_salah
  const persen = total > 0 ? Math.round((hasil.jumlah_benar / total) * 100) : 0
  const durasiDetik = Math.max(
    0,
    Math.round((new Date(hasil.finished_at).getTime() - new Date(hasil.started_at).getTime()) / 1000)
  )

  // Peta kosakata_id -> teks_soal & opsi, dari sesi, untuk menampilkan
  // ulang soal mana yang salah beserta jawaban yang benar.
  const soalById = {}
  for (const s of sesi.soal) soalById[s.kosakata_id] = s

  const salahList = hasil.detail.filter((d) => !d.benar)

  return (
    <div className="game1-result">
      <h1 className="game1-title">Hasil</h1>

      <div className="game1-result-score">
        <span className="game1-result-score-num">{persen}%</span>
        <span className="game1-result-score-sub">{hasil.jumlah_benar} benar dari {total} soal</span>
      </div>

      <div className="game1-result-stats">
        <div className="game1-result-stat">
          <span className="game1-result-stat-num">{hasil.jumlah_benar}</span>
          <span className="game1-result-stat-label">Benar</span>
        </div>
        <div className="game1-result-stat">
          <span className="game1-result-stat-num">{hasil.jumlah_salah}</span>
          <span className="game1-result-stat-label">Salah</span>
        </div>
        <div className="game1-result-stat">
          <span className="game1-result-stat-num">{durasiDetik}s</span>
          <span className="game1-result-stat-label">Waktu</span>
        </div>
      </div>

      {salahList.length > 0 && (
        <section className="game1-block">
          <h2 className="game1-block-title">Perlu diulang ({salahList.length})</h2>
          <div className="game1-review-list">
            {salahList.map((d) => {
              const soal = soalById[d.kosakata_id]
              if (!soal) return null
              const opsiBenar = soal.opsi.find((o) => o.kosakata_id === d.jawaban_benar_kosakata_id)
              const opsiDipilih = soal.opsi.find((o) => o.kosakata_id === d.id_kosakata_dipilih)
              return (
                <div key={d.kosakata_id} className="game1-review-item">
                  <p className="game1-review-soal">{soal.teks_soal}</p>
                  <p className="game1-review-jawaban">
                    <span className="game1-review-label-salah">
                      Kamu jawab: {opsiDipilih ? opsiDipilih.teks : '(tidak dijawab)'}
                    </span>
                    <span className="game1-review-label-benar">
                      Jawaban benar: {opsiBenar ? opsiBenar.teks : '-'}
                    </span>
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <div className="game1-result-actions">
        <button type="button" className="game1-btn-primary" onClick={onMainLagi}>Main Lagi</button>
        <button type="button" className="game1-btn-secondary" onClick={onExit}>Kembali ke Quiz</button>
      </div>
    </div>
  )
}
