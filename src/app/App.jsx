import { useLocation } from 'react-router-dom'
import PixiBackground from '../shared/components/PixiBackground'
import GlobalSearch from '../shared/components/GlobalSearch'
import AppRoutes from './routes'

function App() {
  const location = useLocation()
  // Halaman game (/quiz/game_1, /quiz/game_2, dst) tampil "polos" --
  // tanpa background PixiJS maupun widget pencarian kosakata global,
  // supaya tidak mengganggu tampilan/gameplay. GameHub (/quiz) sendiri
  // tetap menampilkan keduanya seperti biasa.
  const isGamePage = /^\/quiz\/game_/.test(location.pathname)

  return (
    <>
      {!isGamePage && <PixiBackground />}
      {!isGamePage && <GlobalSearch />}
      <AppRoutes />
    </>
  )
}

export default App
