import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'

// allowedRoles opsional: kalau diisi (misal ['admin']), hanya user dengan
// role tsb yang boleh lihat halaman ini. Kalau tidak diisi, cukup login
// (role apa saja) seperti perilaku semula.
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) return <p className="status-line">Memuat…</p>
  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="placeholder-page">
        <Link className="back-link" to="/dashboard">&larr; Kembali ke Dashboard</Link>
        <h1>Akses Ditolak</h1>
        <p>Halaman ini khusus untuk role {allowedRoles.join('/')}. Akun kamu berperan sebagai "{user.role}".</p>
      </div>
    )
  }

  return children
}
