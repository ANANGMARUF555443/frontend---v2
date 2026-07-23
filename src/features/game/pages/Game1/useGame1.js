import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../../auth/context/AuthContext'
import { kosakataApi } from '../../../kosakata/api'
import { game1Api } from './api'

// Tahapan layar dalam satu kunjungan ke halaman Game1.
export const TAHAP = {
  MUAT: 'muat', // ambil meta + preset + tandai awal
  SETUP: 'setup', // pilih jenis_game, parameter, preset
  MAIN: 'main', // soal berjalan, timer aktif
  HASIL: 'hasil', // ringkasan setelah submit
  ERROR: 'error',
}

// Satu hook besar yang menyimpan seluruh state alur Game1 supaya
// komponen (Setup/Player/Result) tinggal terima props & pemanggil aksi,
// tidak perlu tahu detail pemanggilan API.
export function useGame1() {
  const { token } = useAuth()

  const [tahap, setTahap] = useState(TAHAP.MUAT)
  const [errorMsg, setErrorMsg] = useState('')

  const [meta, setMeta] = useState(null)
  const [presetList, setPresetList] = useState([])
  const [tandaiList, setTandaiList] = useState([]) // hasil listTandaiKosakata (punya field .kosakata)

  const [sesi, setSesi] = useState(null) // hasil /game1/mulai (id, soal, durasi, dst)
  const [hasil, setHasil] = useState(null) // hasil /game1/{id}/submit

  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  // ── Muat data awal ──────────────────────────────────────────────────
  const muatAwal = useCallback(async () => {
    setTahap(TAHAP.MUAT)
    setErrorMsg('')
    try {
      const [metaData, presetData, tandaiData] = await Promise.all([
        game1Api.meta(token),
        game1Api.listSetting(token),
        kosakataApi.listTandaiKosakata(token),
      ])
      if (!mountedRef.current) return
      setMeta(metaData)
      setPresetList(presetData)
      setTandaiList(tandaiData)
      setTahap(TAHAP.SETUP)
    } catch (err) {
      if (!mountedRef.current) return
      setErrorMsg(err.message || 'Gagal memuat data Game 1.')
      setTahap(TAHAP.ERROR)
    }
  }, [token])

  useEffect(() => {
    muatAwal()
  }, [muatAwal])

  // ── Preset (setting tersimpan) ──────────────────────────────────────
  const simpanPreset = useCallback(
    async (payload) => {
      const baru = await game1Api.createSetting(payload, token)
      setPresetList((prev) => [baru, ...prev])
      return baru
    },
    [token]
  )

  const hapusPreset = useCallback(
    async (id) => {
      await game1Api.deleteSetting(id, token)
      setPresetList((prev) => prev.filter((p) => p.id !== id))
    },
    [token]
  )

  // ── Cek ketersediaan (dipanggil Setup saat filter berubah) ──────────
  const cekKetersediaan = useCallback(
    (payload) => game1Api.cekKetersediaan(payload, token),
    [token]
  )

  // ── Mulai sesi ──────────────────────────────────────────────────────
  const mulaiSesi = useCallback(
    async (payload) => {
      setErrorMsg('')
      const data = await game1Api.mulai(payload, token)
      if (!mountedRef.current) return
      setSesi(data)
      setHasil(null)
      setTahap(TAHAP.MAIN)
    },
    [token]
  )

  // ── Submit jawaban ──────────────────────────────────────────────────
  const submitJawaban = useCallback(
    async (semuaJawaban) => {
      if (!sesi) return
      try {
        const data = await game1Api.submit(sesi.id, semuaJawaban, token)
        if (!mountedRef.current) return
        setHasil(data)
        setTahap(TAHAP.HASIL)
      } catch (err) {
        if (!mountedRef.current) return
        setErrorMsg(err.message || 'Gagal mengirim jawaban.')
        setTahap(TAHAP.ERROR)
      }
    },
    [sesi, token]
  )

  // Kembali ke Setup untuk main lagi (tanpa reload halaman/re-fetch meta).
  const mainLagi = useCallback(() => {
    setSesi(null)
    setHasil(null)
    setTahap(TAHAP.SETUP)
  }, [])

  return useMemo(
    () => ({
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
    }),
    [
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
    ]
  )
        }
