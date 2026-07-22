import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import { dashboardApi } from '../api'
import FeaturePopup from './FeaturePopup'
import useExitOnBack from '../../../shared/hooks/useExitOnBack'
import '../../../shared/styles/Auth.css'
import './Dashboard.css'

// Daftar folder di dashboard. Tambah/kurangi objek di sini
// kalau nanti mau nambah atau menghapus modul.
const FOLDERS = [
  { to: '/kosakata', icon: '冊', title: 'Kosakata', desc: 'Daftar kata Korea-Indonesia' },
  { to: '/tata-bahasa', icon: '法', title: 'Tata Bahasa', desc: '120 pola tata bahasa' },
  { to: '/quiz', icon: '問', title: 'Quiz', desc: 'Latihan & uji kemampuan' },
  { to: '/buku', icon: 'EPS', title: 'Buku', desc: 'Daftar BAB Korea-Indonesia' },
    { to: '/admin/files', icon: '庫', title: 'File Manager', desc: 'Jelajah folder Cloudinary & media library', adminOnly: true },
]

export default function Dashboard() {
  const { user, signOut, resendVerification } = useAuth()
  const navigate = useNavigate()
  const [resendStatus, setResendStatus] = useState('') // '' | 'sending' | 'sent'

  async function handleResend() {
    setResendStatus('sending')
    try {
      await resendVerification(user.email)
    } finally {
      setResendStatus('sent')
    }
  }

  // Dashboard = halaman utama. Sekali swipe-back / tombol back di sini
  // harus langsung keluar aplikasi (bukan mundur ke halaman lama yang
  // pernah dibuka, dan bukan logout -- logout tetap lewat tombol "Keluar").
  useExitOnBack(true)

  // Satu state saja untuk kedua popup, supaya Berita dan Catatan
  // tidak bisa terbuka bersamaan -- buka salah satu otomatis menutup yang lain.
  const [activePopup, setActivePopup] = useState(null) // null | 'berita' | 'catatan'

  // Folder admin-only (Kosakata, Buku, File Manager) tampil untuk role
  // "admin" dan "pro" -- untuk sekarang "pro" mendapat akses yang sama
  // seperti "admin" ke modul-modul ini.
  const visibleFolders = FOLDERS.filter(
    (folder) => !folder.adminOnly || user?.role === 'admin' || user?.role === 'pro'
  )

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Masuk sebagai {user?.email}
            {user?.role && <span className={`role-badge role-badge--${user.role}`}>{user.role}</span>}
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button className="logout-btn" onClick={handleLogout}>Keluar</button>
        </div>
      </div>

      {user && user.is_verified === false && (
        <p className="auth-info" style={{ marginBottom: 20 }}>
          Email kamu belum terverifikasi.{' '}
          {resendStatus === 'sent' ? (
            'Tautan verifikasi baru sudah dikirim, cek inbox kamu.'
          ) : (
            <button
              onClick={handleResend}
              disabled={resendStatus === 'sending'}
              style={{ border: 'none', background: 'none', color: 'var(--seal)', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline' }}
            >
              {resendStatus === 'sending' ? 'Mengirim…' : 'Kirim ulang tautan verifikasi'}
            </button>
          )}
        </p>
      )}

      <div className="folder-grid">
        {visibleFolders.map((folder) => (
          <Link className="folder-card" to={folder.to} key={folder.to}>
            <span className="folder-icon">{folder.icon}</span>
            <span className="folder-title">{folder.title}</span>
            <span className="folder-desc">{folder.desc}</span>
          </Link>
        ))}
      </div>

      <FeaturePopup
        open={activePopup === 'berita'}
        onOpen={() => setActivePopup('berita')}
        onClose={() => setActivePopup(null)}
        icon="📰"
        title="Berita"
        subtitle={user?.role === 'admin' ? 'Sama untuk semua pengguna' : 'Sama untuk semua pengguna — hanya admin yang bisa mengelola'}
        itemNoun="berita"
        fabOffset={0}
        readOnly={user?.role !== 'admin'}
        api={{
          list: dashboardApi.listBerita,
          create: dashboardApi.createBerita,
          update: dashboardApi.updateBerita,
          remove: dashboardApi.deleteBerita,
        }}
      />

      <FeaturePopup
        open={activePopup === 'catatan'}
        onOpen={() => setActivePopup('catatan')}
        onClose={() => setActivePopup(null)}
        icon="📝"
        title="Catatan"
        subtitle="Hanya kamu yang bisa lihat"
        itemNoun="catatan"
        fabOffset={1}
        api={{
          list: dashboardApi.listCatatan,
          create: dashboardApi.createCatatan,
          update: dashboardApi.updateCatatan,
          remove: dashboardApi.deleteCatatan,
        }}
      />
    </div>
  )
}
