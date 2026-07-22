import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Email atau kata sandi salah.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <span className="auth-watermark" aria-hidden="true">辭</span>

      <div className="auth-card">
        <p className="auth-entry-no">ENTRI · 0084</p>

        <h1 className="auth-headword" lang="ko">로그인</h1>
        <p className="auth-gloss">
          <span className="pos">v.</span> masuk ke akun
        </p>
        <hr className="auth-divider" />
        <p className="auth-tagline">Masuk untuk lanjut belajar kosakata dan tata bahasa.</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <div className="auth-field-label-row">
              <label htmlFor="login-password">Kata sandi</label>
              <Link to="/forgot-password" className="auth-inline-link">Lupa kata sandi?</Link>
            </div>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-stamp-btn" disabled={loading}>
            <span className="stamp-mark" aria-hidden="true">印</span>
            {loading ? 'Memproses…' : 'Masuk'}
          </button>
        </form>

        <p className="auth-crossref">
          → lihat juga: <Link to="/register">회원가입 · Daftar akun</Link>
        </p>
      </div>
    </div>
  )
}
