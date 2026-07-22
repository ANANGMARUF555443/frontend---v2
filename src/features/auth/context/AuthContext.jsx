import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api'

const AuthContext = createContext(null)
const TOKEN_KEY = 'kamus_token'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Setiap kali token berubah (login/logout/refresh halaman), cek siapa usernya
  useEffect(() => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    authApi
      .me(token)
      .then((data) => setUser(data))
      .catch(() => {
        // Token tidak valid/kedaluwarsa -> anggap logout
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  async function login(email, password) {
    const data = await authApi.login(email, password)
    localStorage.setItem(TOKEN_KEY, data.access_token)
    setToken(data.access_token)
    setUser(data.user)
  }

  async function register(payload) {
    const data = await authApi.register(payload)
    localStorage.setItem(TOKEN_KEY, data.access_token)
    setToken(data.access_token)
    setUser(data.user)
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  async function verifyEmail(verifyToken) {
    return authApi.verifyEmail(verifyToken)
  }

  async function resendVerification(email) {
    return authApi.resendVerification(email)
  }

  async function forgotPassword(email) {
    return authApi.forgotPassword(email)
  }

  async function resetPassword(resetToken, newPassword) {
    return authApi.resetPassword(resetToken, newPassword)
  }

  // Setelah verifikasi email berhasil, refresh data user (kalau sedang login)
  // supaya field is_verified di UI langsung ter-update tanpa perlu reload.
  async function refreshUser() {
    if (!token) return
    try {
      const data = await authApi.me(token)
      setUser(data)
    } catch {
      // token mungkin sudah tidak valid, biarkan effect di atas yang menangani
    }
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    signOut,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
