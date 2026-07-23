import { useState } from 'react'
import './SetupGeneralParams.css'

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

export default function SetupGeneralParams({
  meta,
  form,
  updateForm,
  presetTerpilih,
  ketersediaan,
  mengecek,
  onCekKetersediaan,
  onSimpanPreset,
  onError,
}) {
  const [simpanTerbuka, setSimpanTerbuka] = useState(false)
  const [namaPresetBaru, setNamaPresetBaru] = useState('')

  if (presetTerpilih) return null

  async function handleSimpan() {
    if (!namaPresetBaru.trim()) return
    try {
      await onSimpanPreset(namaPresetBaru.trim())
      setNamaPresetBaru('')
      setSimpanTerbuka(false)
    } catch (err) {
      onError(err.message || 'Gagal menyimpan preset.')
    }
  }

  return (
    <>
      <section className="game1-block">
        <h2 className="game1-block-title">Tipe Soal</h2>
        <div className="game1-chip-row">
          <button
            type="button"
            className={`game1-chip ${
              form.tipe_soal === 'korea_ke_indonesia' ? 'is-active' : ''
            }`}
            onClick={() => updateForm({ tipe_soal: 'korea_ke_indonesia' })}
          >
            Korea &rarr; Indonesia
          </button>
          <button
            type="button"
            className={`game1-chip ${
              form.tipe_soal === 'indonesia_ke_korea' ? 'is-active' : ''
            }`}
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
              className={`game1-chip ${
                form.mode_waktu === mw ? 'is-active' : ''
              }`}
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
              className={`game1-chip ${
                form.level_pilihan_ganda === lv ? 'is-active' : ''
              }`}
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
              const opsi = ketersediaan?.opsi_jumlah_soal?.find(
                (o) => o.jumlah_soal === n
              )
              const nonaktif = ketersediaan ? !opsi?.aktif : false
              return (
                <button
                  key={n}
                  type="button"
                  disabled={nonaktif}
                  className={`game1-chip ${
                    form.jumlah_soal === n ? 'is-active' : ''
                  }`}
                  onClick={() => updateForm({ jumlah_soal: n })}
                >
                  {n}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            className="game1-link-btn"
            onClick={onCekKetersediaan}
            disabled={mengecek}
          >
            {mengecek ? 'Mengecek...' : 'Cek ketersediaan soal'}
          </button>
          {ketersediaan && (
            <p className="game1-hint">
              {ketersediaan.jumlah_tersedia} kosakata tersedia untuk kombinasi ini.
            </p>
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
            <button
              type="button"
              className="game1-btn-secondary"
              onClick={handleSimpan}
            >
              Simpan
            </button>
            <button
              type="button"
              className="game1-link-btn"
              onClick={() => setSimpanTerbuka(false)}
            >
              Batal
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="game1-link-btn"
            onClick={() => setSimpanTerbuka(true)}
          >
            Simpan setelan ini sebagai preset
          </button>
        )}
      </section>
    </>
  )
}