import { Link } from 'react-router-dom'
import './Game1.css'

// Game 1 -- halaman mandiri, tidak pinjam style/CSS dari halaman lain
// (tidak import Auth.css / Dashboard.css). Semua tampilan (termasuk
// tombol kembali) diatur sendiri lewat Game1.css dengan prefix class
// "game1-" supaya tidak bentrok kalau nanti CSS global berubah.
//
// Saat ini isinya cuma tombol keluar; nanti tinggal tambah markup
// game sungguhan di dalam <div className="game1-page"> ini.
export default function Game1() {
  return (
    <div className="game1-page">
      <Link className="game1-exit-btn" to="/quiz">&larr; Kembali ke Quiz</Link>
    </div>
  )
}
