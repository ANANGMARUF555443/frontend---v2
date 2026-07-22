import { Link } from 'react-router-dom'
import '../../../../shared/styles/Auth.css'
import '../../../dashboard/pages/Dashboard.css'
import './GameHub.css'

// Daftar jenis game hafalan. Tambah game baru cukup nambah objek di
// sini + folder komponennya sendiri (mis. src/pages/Game/TataBahasa/)
// -- tidak perlu ubah routing App.jsx tiap kali nambah game baru,
// cukup daftarkan route barunya sekali di App.jsx dan tambah di sini.
const GAMES = [
  {
    to: '/quiz/acak-kata',
    icon: '亂',
    title: 'Acak Kata',
    desc: 'Pilih bab & kosakata sendiri, lalu uji hafalanmu sebelum waktu habis.',
    ready: true,
  },
  {
    to: '/quiz/tebak-arti',
    icon: '義',
    title: 'Tebak Arti',
    desc: 'Segera hadir.',
    ready: false,
  },
  {
    to: '/quiz/dengar-ucap',
    icon: '音',
    title: 'Dengar & Ucap',
    desc: 'Segera hadir.',
    ready: false,
  },
]

export default function GameHub() {
  return (
    <div className="placeholder-page game-hub">
      <Link className="back-link" to="/dashboard">&larr; Kembali ke Dashboard</Link>
      <h1>Quiz</h1>
      <p>Pilih jenis permainan untuk melatih hafalanmu.</p>

      <div className="folder-grid">
        {GAMES.map((game) =>
          game.ready ? (
            <Link className="folder-card" to={game.to} key={game.to}>
              <span className="folder-icon">{game.icon}</span>
              <span className="folder-title">{game.title}</span>
              <span className="folder-desc">{game.desc}</span>
            </Link>
          ) : (
            <div className="folder-card folder-card--soon" key={game.to} aria-disabled="true">
              <span className="folder-icon">{game.icon}</span>
              <span className="folder-title">{game.title}</span>
              <span className="folder-desc">{game.desc}</span>
              <span className="folder-soon-badge">Segera</span>
            </div>
          )
        )}
      </div>
    </div>
  )
}
