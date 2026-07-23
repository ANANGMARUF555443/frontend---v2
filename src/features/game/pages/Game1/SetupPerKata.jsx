import { useEffect, useState } from 'react'
import SetupPerBab from './SetupPerBab'
import { kosakataApi } from '../../../kosakata/api'
import './SetupPerKata.css'

export default function SetupPerKata({
  babDipilih,
  babCount,
  onBabChange,
  letakChoices,
  idKosakataDitandai,
  onUpdateKosakataDitandai,
  token,
}) {
  const [letakAktif, setLetakAktif] = useState('')
  const [daftarKosakata, setDaftarKosakata] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!letakAktif && letakChoices?.length > 0) {
      setLetakAktif(letakChoices[0].key)
    }
  }, [letakChoices, letakAktif])

  useEffect(() => {
    if (!letakAktif) return
    let batal = false
    setLoading(true)
    setErrorMsg('')

    kosakataApi
      .listKosakata(token, { bab: babDipilih, letak: letakAktif })
      .then((data) => {
        if (batal) return
        setDaftarKosakata(data)
        onUpdateKosakataDitandai([])
      })
      .catch((err) => {
        if (batal) return
        setErrorMsg(err.message || 'Gagal memuat kosakata.')
        setDaftarKosakata([])
      })
      .finally(() => {
        if (!batal) setLoading(false)
      })

    return () => {
      batal = true
    }
  }, [babDipilih, letakAktif, token])

  function toggleItem(id) {
    const ada = idKosakataDitandai.includes(id)
    const next = ada
      ? idKosakataDitandai.filter((x) => x !== id)
      : [...idKosakataDitandai, id]
    onUpdateKosakataDitandai(next)
  }

  return (
    <>
      <SetupPerBab
        babDipilih={babDipilih}
        babCount={babCount}
        onBabChange={onBabChange}
      />

      <section className="game1-block">
        <h2 className="game1-block-title">Pilih Letak</h2>
        <div className="game1-chip-row">
          {letakChoices.map((l) => (
            <button
              key={l.key}
              type="button"
              className={`game1-chip ${
                letakAktif === l.key ? 'is-active' : ''
              }`}
              onClick={() => setLetakAktif(l.key)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </section>

      <section className="game1-block">
        <h2 className="game1-block-title">
          Tandai kosakata ({idKosakataDitandai.length}/{daftarKosakata.length} dipilih)
        </h2>
        {loading && <p className="game1-hint">Memuat kosakata...</p>}
        {errorMsg && <p className="game1-error">{errorMsg}</p>}
        {!loading && !errorMsg && (
          daftarKosakata.length === 0 ? (
            <p className="game1-hint">Tidak ada kosakata di bab &amp; letak ini.</p>
          ) : (
            <>
              <div className="game1-tandai-actions">
                <button
                  type="button"
                  className="game1-link-btn"
                  onClick={() =>
                    onUpdateKosakataDitandai(daftarKosakata.map((k) => k.id))
                  }
                >
                  Tandai semua
                </button>
                <button
                  type="button"
                  className="game1-link-btn"
                  onClick={() => onUpdateKosakataDitandai([])}
                >
                  Batal semua
                </button>
              </div>
              <div className="game1-kosakata-pick-list">
                {daftarKosakata.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    className={`game1-kosakata-pick ${
                      idKosakataDitandai.includes(k.id) ? 'is-active' : ''
                    }`}
                    onClick={() => toggleItem(k.id)}
                  >
                    <span className="game1-kosakata-pick-ko">
                      {k.korean_text}
                    </span>
                    <span className="game1-kosakata-pick-id">
                      {k.indonesian_text}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )
        )}
      </section>
    </>
  )
}