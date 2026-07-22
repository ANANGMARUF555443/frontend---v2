import { AuthProvider } from '../features/auth/context/AuthContext'

// Semua provider global digabung di sini. Kalau nanti nambah context baru
// (mis. ThemeProvider), tinggal bungkus di sini -- main.jsx tidak perlu diubah.
function AppProviders({ children }) {
  return <AuthProvider>{children}</AuthProvider>
}

export default AppProviders
