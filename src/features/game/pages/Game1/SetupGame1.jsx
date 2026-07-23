import { useMemo, useState } from 'react'
import { useAuth } from '../../../auth/context/AuthContext'
import SetupPresetSelector from './SetupPresetSelector'
import SetupGeneralParams from './SetupGeneralParams'
import SetupPerBab from './SetupPerBab'
import SetupPerLetak from './SetupPerLetak'
import SetupPerKata from './SetupPerKata'
import SetupCampuran from './SetupCampuran'
import './SetupGame1.css'

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

const MODE_COMPONENTS = {
  per_bab: SetupPerBab,
  per_letak: SetupPerLetak,
  per_kata: SetupPerKata,
  campuran: SetupCampuran,
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

export default function SetupGame1({
  meta,
  presetList,
  tandaiList,
  onMulai,
  onSimpanPreset,
  onHapusPreset,
  onCekKetersediaan,
  onExit,
}) {
  const { token } = useAuth()
  const [form, setForm] = useState(() => emptyForm(meta))
  const [presetTerpilih, setPresetTerpilih] = useState('')
  const [ketersediaan, setKetersediaan] = useState(null)
  const [mengecek, setMengecek] = useState(false)
  const [memulai, setMemulai] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

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

  async function handleCekKetersediaan() {
    setErrorMsg('')
    setMengecek(true)
    try {
      const data = await onCekKetersediaan(payloadKetersediaan)
      setKetersediaan(data)
      const opsiAktif = data.opsi_jumlah_soal.find((o) => o.aktif)
      const jumlahSaatIniAktif = data.opsi_jumlah_soal.find(
        (o) => o.jumlah_soal === form.jumlah_soal
      )?.aktif
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
      const payload = {
        id_setting_game1: presetTerpilih ? Number(presetTerpilih) : null,
      }
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

  async function handleSimpanPreset(nama) {
    await onSimpanPreset({
      nama_setting: nama,
      jumlah_soal: form.jumlah_soal,
      mode_waktu: form.mode_waktu,
      level_pilihan_ganda: form.level_pilihan_ganda,
      tipe_soal: form.tipe_soal,
      jenis_game: form.jenis_game,
    })
  }

  if (!meta) return null

  const ModeComponent = MODE_COMPONENTS[form.jenis_game]

  return (
    <div className="game1-setup">
      <div className="game1-setup-head">
        <button type="button" className="game1-exit-btn" onClick={onExit}>
          &larr; Kembali ke Quiz
        </button>
        <h1 className="game1-title">Game 1 -- Susun Setelan</h1>
      </div>

      <SetupPresetSelector
        presetList={presetList}
        presetTerpilih={presetTerpilih}
        onSelectPreset={terapkanPreset}
        onHapusPreset={onHapusPreset}
      />

      <section className="game1-block">
        <h2 className="game1-block-title">Jenis Game</h2>
        <div className="game1-option-grid">
          {meta.jenis_game_choices.map((jg) => (
            <button
              key={jg}
              type="button"
              className={`game1-option-card ${
                form.jenis_game === jg ? 'is-active' : ''
              }`}
              onClick={() => updateForm({ jenis_game: jg })}
            >
              <span className="game1-option-title">
                {JENIS_GAME_LABEL[jg] || jg}
              </span>
              <span className="game1-option-desc">{JENIS_GAME_DESC[jg]}</span>
            </button>
          ))}
        </div>
      </section>

      {ModeComponent && (
        <ModeComponent
          babDipilih={form.bab_dipilih}
          babCount={meta.bab_count}
          onBabChange={(b) => updateForm({ bab_dipilih: b })}
          letakChoices={meta.letak_choices}
          maksLetak={meta.maks_letak_ditandai}
          letakDitandai={form.letak_ditandai}
          onToggleLetak={(k) => {
            const ada = form.letak_ditandai.includes(k)
            const next = ada
              ? form.letak_ditandai.filter((x) => x !== k)
              : [...form.letak_ditandai, k]
            updateForm({ letak_ditandai: next })
          }}
          idKosakataDitandai={form.id_kosakata_ditandai}
          onUpdateKosakataDitandai={(list) =>
            updateForm({ id_kosakata_ditandai: list })
          }
          onToggleKosakata={(id) => {
            const ada = form.id_kosakata_ditandai.includes(id)
            const next = ada
              ? form.id_kosakata_ditandai.filter((x) => x !== id)
              : [...form.id_kosakata_ditandai, id]
            updateForm({ id_kosakata_ditandai: next })
          }}
          tandaiList={tandaiList}
          token={token}
        />
      )}

      <SetupGeneralParams
        meta={meta}
        form={form}
        updateForm={updateForm}
        presetTerpilih={presetTerpilih}
        ketersediaan={ketersediaan}
        mengecek={mengecek}
        onCekKetersediaan={handleCekKetersediaan}
        onSimpanPreset={handleSimpanPreset}
        onError={setErrorMsg}
      />

      {errorMsg && <p className="game1-error">{errorMsg}</p>}

      <button
        type="button"
        className="game1-btn-primary game1-btn-mulai"
        onClick={handleMulai}
        disabled={memulai}
      >
        {memulai ? 'Menyiapkan soal...' : 'Mulai'}
      </button>
    </div>
  )
}