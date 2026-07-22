import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

function checkPasswordStrength(password) {
  if (password.length < 8) return 'Kata sandi minimal 8 karakter.'
  if (!/[a-zA-Z]/.test(password)) return 'Kata sandi harus mengandung minimal 1 huruf.'
  if (!/[0-9]/.test(password)) return 'Kata sandi harus mengandung minimal 1 angka.'
  return null
}

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [nomorHp, setNomorHp] = useState('')
  const [nomorWhatsapp, setNomorWhatsapp] = useState('')
  const [jenisKelamin, setJenisKelamin] = useState('')
  const [tanggalLahir, setTanggalLahir] = useState('')
  const [tempatBelajar, setTempatBelajar] = useState('') // '' | 'mandiri' | 'lpk'
  const [namaLpk, setNamaLpk] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const { register } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const strengthError = checkPasswordStrength(password)
    if (strengthError) {
      setError(strengthError)
      setLoading(false)
      return
    }

    if (tempatBelajar === 'lpk' && !namaLpk.trim()) {
      setError('Nama LPK wajib diisi kalau memilih tempat belajar LPK.')
      setLoading(false)
      return
    }

    try {
      await register({
        email,
        password,
        nomor_hp: nomorHp.trim() || null,
        nomor_whatsapp: nomorWhatsapp.trim() || null,
        jenis_kelamin: jenisKelamin || null,
        tanggal_lahir: tanggalLahir || null,
        tempat_belajar: tempatBelajar || null,
        nama_lpk: tempatBelajar === 'lpk' ? namaLpk.trim() : null,
      })
      // Tidak langsung navigate ke /dashboard -- tampilkan dulu pesan supaya
      // user tahu perlu mengonfirmasi email. AuthContext tetap menyimpan
      // token, jadi user sebenarnya sudah "login" di background.
      setRegistered(true)
    } catch (err) {
      setError(err.message || 'Gagal mendaftar. Coba email lain atau periksa koneksi.')
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <div className="auth-page">
        <span className="auth-watermark" aria-hidden="true">典</span>
        <div className="auth-card">
          <p className="auth-entry-no">ENTRI · 0085</p>
          <h1 className="auth-headword" lang="ko">회원가입 완료</h1>
          <p className="auth-gloss">
            <span className="pos">n.</span> pendaftaran berhasil
          </p>
          <hr className="auth-divider" />
          <p className="auth-tagline">
            Akun kamu berhasil dibuat. Kami sudah mengirim tautan konfirmasi ke{' '}
            <strong>{email}</strong> -- buka email tersebut dan klik tautannya untuk
            mengaktifkan akun sepenuhnya.
          </p>
          <p className="auth-crossref">
            → lihat juga: <Link to="/dashboard">Lanjut ke Dashboard</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <span className="auth-watermark" aria-hidden="true">典</span>

      <div className="auth-card">
        <p className="auth-entry-no">ENTRI · 0085</p>

        <h1 className="auth-headword" lang="ko">회원가입</h1>
        <p className="auth-gloss">
          <span className="pos">n.</span> pendaftaran akun baru
        </p>
        <hr className="auth-divider" />
        <p className="auth-tagline">Buat akun baru untuk mulai belajar kosakata dan tata bahasa.</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-password">Kata sandi</label>
            <div className="auth-password-wrap">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-toggle-password"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                tabIndex={-1}
              >
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
            <span className="auth-hint">Minimal 8 karakter, mengandung huruf & angka</span>
          </div>

          <div className="auth-field-row">
            <div className="auth-field">
              <label htmlFor="register-hp">No. Handphone <span className="auth-optional">(opsional)</span></label>
              <input
                id="register-hp"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="08xxxxxxxxxx"
                value={nomorHp}
                onChange={(e) => setNomorHp(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-wa">No. WhatsApp <span className="auth-optional">(opsional)</span></label>
              <input
                id="register-wa"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="08xxxxxxxxxx"
                value={nomorWhatsapp}
                onChange={(e) => setNomorWhatsapp(e.target.value)}
              />
            </div>
          </div>

          <div className="auth-field-row">
            <div className="auth-field">
              <label htmlFor="register-gender">Jenis kelamin</label>
              <select
                id="register-gender"
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value)}
              >
                <option value="">Pilih…</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div className="auth-field">
              <label htmlFor="register-dob">Tanggal lahir</label>
              <input
                id="register-dob"
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Tempat belajar</label>
            <div className="auth-choice-group">
              <button
                type="button"
                className={`auth-choice-btn ${tempatBelajar === 'mandiri' ? 'is-active' : ''}`}
                onClick={() => {
                  setTempatBelajar('mandiri')
                  setNamaLpk('')
                }}
              >
                Mandiri
              </button>
              <button
                type="button"
                className={`auth-choice-btn ${tempatBelajar === 'lpk' ? 'is-active' : ''}`}
                onClick={() => setTempatBelajar('lpk')}
              >
                LPK
              </button>
            </div>
          </div>

          {tempatBelajar === 'lpk' && (
            <div className="auth-field">
              <label htmlFor="register-lpk">Nama LPK</label>
              <input
                id="register-lpk"
                type="text"
                placeholder="Nama lembaga LPK"
                value={namaLpk}
                onChange={(e) => setNamaLpk(e.target.value)}
                required
              />
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-stamp-btn" disabled={loading}>
            <span className="stamp-mark" aria-hidden="true">印</span>
            {loading ? 'Memproses…' : 'Daftar'}
          </button>
        </form>

        <p className="auth-crossref">
          → lihat juga: <Link to="/login">로그인 · Masuk</Link>
        </p>
      </div>
    </div>
  )
}
