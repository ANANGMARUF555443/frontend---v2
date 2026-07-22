import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()
  const { resetPassword } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Tautan tidak valid. Minta tautan reset password baru.')
      return
    }
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Kata sandi minimal 8 karakter dan mengandung huruf serta angka.')
      return
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.message || 'Gagal mengatur ulang kata sandi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <span className="auth-watermark" aria-hidden="true">改</span>

      <div className="auth-card">
        <p className="auth-entry-no">ENTRI · 0087</p>

        <h1 className="auth-headword" lang="ko">비밀번호 재설정</h1>
        <p className="auth-gloss">
          <span className="pos">v.</span> atur ulang kata sandi
        </p>
        <hr className="auth-divider" />

        {!token ? (
          <p className="auth-error">
            Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru lewat halaman{' '}
            <Link to="/forgot-password">lupa kata sandi</Link>.
          </p>
        ) : done ? (
          <p className="auth-tagline">
            Kata sandi berhasil diperbarui. Mengalihkan ke halaman login…
          </p>
        ) : (
          <>
            <p className="auth-tagline">Buat kata sandi baru untuk akun kamu.</p>

            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="new-password">Kata sandi baru</label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span className="auth-hint">Minimal 8 karakter, mengandung huruf & angka</span>
              </div>

              <div className="auth-field">
                <label htmlFor="confirm-password">Konfirmasi kata sandi</label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="auth-stamp-btn" disabled={loading}>
                <span className="stamp-mark" aria-hidden="true">印</span>
                {loading ? 'Memproses…' : 'Simpan Kata Sandi'}
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
