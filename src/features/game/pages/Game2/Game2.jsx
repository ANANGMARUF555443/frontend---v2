import { Link } from 'react-router-dom'
import '../../../../shared/styles/Auth.css'
import '../../../dashboard/pages/Dashboard.css'
import './Game2.css'

// Placeholder untuk Game 2. Ganti isi return() ini dengan komponen
// game sungguhan kalau sudah siap dikembangkan -- struktur file,
// import, dan route (di src/app/routes.jsx) tidak perlu diubah.
export default function Game2() {
  return (
    <div className="placeholder-page game-placeholder">
      <Link className="back-link" to="/quiz">&larr; Kembali ke Quiz</Link>
      <h1>Game 2</h1>
      <p>Halaman ini belum dibangun. Segera hadir.</p>
    </div>
  )
}
