import { useNavigate } from 'react-router-dom'
import { useGame1, TAHAP } from './useGame1'
import SetupGame1 from './SetupGame1'
import PlayerGame1 from './PlayerGame1'
import ResultGame1 from './ResultGame1'
import './Game1.css'

export default function Game1() {
  const navigate = useNavigate()
  const {
    tahap,
    errorMsg,
    meta,
    presetList,
    tandaiList,
    sesi,
    hasil,
    muatAwal,
    simpanPreset,
    hapusPreset,
    cekKetersediaan,
    mulaiSesi,
    submitJawaban,
    mainLagi,
  } = useGame1()

  function keluarKeQuiz() {
    navigate('/quiz')
  }

  if (tahap === TAHAP.MUAT) {
    return (
      <div className="game1-page">
        <div className="game1-loading">Memuat Game 1...</div>
      </div>
    )
  }

  if (tahap === TAHAP.ERROR) {
    return (
      <div className="game1-page">
        <button type="button" className="game1-exit-btn" onClick={keluarKeQuiz}>
          &larr; Kembali ke Quiz
        </button>
        <p className="game1-error">{errorMsg}</p>
        <button type="button" className="game1-btn-primary" onClick={muatAwal}>
          Coba Lagi
        </button>
      </div>
    )
  }

  return (
    <div className="game1-page">
      {tahap === TAHAP.SETUP && (
        <SetupGame1
          meta={meta}
          presetList={presetList}
          tandaiList={tandaiList}
          onMulai={mulaiSesi}
          onSimpanPreset={simpanPreset}
          onHapusPreset={hapusPreset}
          onCekKetersediaan={cekKetersediaan}
          onExit={keluarKeQuiz}
        />
      )}

      {tahap === TAHAP.MAIN && sesi && (
        <PlayerGame1
          key={sesi.id}
          sesi={sesi}
          onSelesai={submitJawaban}
          onBatal={keluarKeQuiz}
        />
      )}

      {tahap === TAHAP.HASIL && hasil && sesi && (
        <ResultGame1
          hasil={hasil}
          sesi={sesi}
          onMainLagi={mainLagi}
          onExit={keluarKeQuiz}
        />
      )}
    </div>
  )
}