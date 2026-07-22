import { Link } from 'react-router-dom'
import './Dashboard.css'

// Halaman sementara untuk folder yang belum dibangun.
// Dipakai bareng untuk Kosakata, Tata Bahasa, Quiz — nanti
// tiap folder bisa diganti komponennya sendiri kalau sudah siap.
export default function Placeholder({ title, desc }) {
  return (
    <div className="placeholder-page">
      <Link className="back-link" to="/dashboard">&larr; Kembali ke Dashboard</Link>
      <h1>{title}</h1>
      <p>{desc || 'Halaman ini belum dibangun. Segera hadir.'}</p>
    </div>
  )
}
