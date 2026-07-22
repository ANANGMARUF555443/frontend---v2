import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { forgotPassword } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await forgotPassword(email)
      // Selalu tampilkan pesan sukses -- backend sengaja tidak membocorkan
      // apakah email ini terdaftar atau tidak.
      setSent(true)
    } catch (err) {
      setError(err.message || 'Gagal mengirim permintaan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <span className="auth-watermark" aria-hidden="true">忘</span>

      <div className="auth-card">
        <p className="auth-entry-no">ENTRI · 0086</p>

        <h1 className="auth-headword" lang="ko">비밀번호 찾기</h1>
        <p className="auth-gloss">
          <span className="pos">v.</span> lupa kata sandi
        </p>
        <hr className="auth-divider" />

        {sent ? (
          <>
            <p className="auth-tagline">
              Kalau email <strong>{email}</strong> terdaftar di sistem kami, tautan untuk
              atur ulang kata sandi sudah kami kirim. Cek folder spam kalau tidak muncul
              dalam beberapa menit.
            </p>
            <p className="auth-crossref">
              → lihat juga: <Link to="/login">로그인 · Masuk</Link>
            </p>
          </>
        ) : (
          <>
            <p className="auth-tagline">
              Masukkan email akun kamu, kami akan kirim tautan untuk membuat kata sandi baru.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="forgot-email">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="auth-stamp-btn" disabled={loading}>
                <span className="stamp-mark" aria-hidden="true">印</span>
                {loading ? 'Mengirim…' : 'Kirim Tautan'}
              </button>
            </form>

            <p className="auth-crossref">
              → lihat juga: <Link to="/login">로그인 · Masuk</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
