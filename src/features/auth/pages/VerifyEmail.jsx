import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const { verifyEmail, refreshUser } = useAuth()

  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')
  const ranOnce = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Tautan verifikasi tidak valid.')
      return
    }
    // Cegah pemanggilan ganda (React StrictMode memanggil effect 2x di dev)
    if (ranOnce.current) return
    ranOnce.current = true

    verifyEmail(token)
      .then((data) => {
        setStatus('success')
        setMessage(data.message)
        refreshUser()
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message || 'Gagal memverifikasi email.')
      })
  }, [token, verifyEmail, refreshUser])

  return (
    <div className="auth-page">
      <span className="auth-watermark" aria-hidden="true">確</span>

      <div className="auth-card">
        <p className="auth-entry-no">ENTRI · 0088</p>

        <h1 className="auth-headword" lang="ko">이메일 확인</h1>
        <p className="auth-gloss">
          <span className="pos">v.</span> konfirmasi email
        </p>
        <hr className="auth-divider" />

        {status === 'loading' && <p className="auth-tagline">Memverifikasi email kamu…</p>}

        {status === 'success' && (
          <>
            <p className="auth-tagline">{message}</p>
            <p className="auth-crossref">
              → lihat juga: <Link to="/dashboard">Kembali ke Dashboard</Link>
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="auth-error">{message}</p>
            <p className="auth-crossref">
              → lihat juga: <Link to="/login">로그인 · Masuk</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
