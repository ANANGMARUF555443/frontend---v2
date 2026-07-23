import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../shared/components/ProtectedRoute'

import Login from '../features/auth/pages/Login'
import Register from '../features/auth/pages/Register'
import ForgotPassword from '../features/auth/pages/ForgotPassword'
import ResetPassword from '../features/auth/pages/ResetPassword'
import VerifyEmail from '../features/auth/pages/VerifyEmail'

import Dashboard from '../features/dashboard/pages/Dashboard'
import Placeholder from '../features/dashboard/pages/Placeholder'

import KosakataAdmin from '../features/kosakata/pages/KosakataAdmin'
import BukuAdmin from '../features/buku/pages/BukuAdmin'

import GameHub from '../features/game/pages/GameHub/GameHub'
import Game1 from '../features/game/pages/Game1/Game1'
import Game2 from '../features/game/pages/Game2/Game2'

import FileManager from '../features/file-manager/pages/FileManager'

// Catatan: route dengan allowedRoles={['admin']} di bawah ini otomatis
// juga terbuka untuk role "pro" -- itu diatur di ProtectedRoute.jsx,
// tidak perlu ditulis ['admin', 'pro'] di sini.
//
// Menambah fitur/game baru: buat folder baru di src/features/<nama>,
// lalu daftarkan halamannya di sini sekali saja.
function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kosakata"
        element={
          <ProtectedRoute>
            <KosakataAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tata-bahasa"
        element={
          <ProtectedRoute>
            <Placeholder title="Tata Bahasa" desc="120 pola tata bahasa — segera hadir." />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz"
        element={
          <ProtectedRoute>
            <GameHub />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/game_1"
        element={
          <ProtectedRoute>
            <Game1 />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/game_2"
        element={
          <ProtectedRoute>
            <Game2 />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/game_3"
        element={
          <ProtectedRoute>
            <Game3 />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/game_4"
        element={
          <ProtectedRoute>
            <Game4 />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/game_5"
        element={
          <ProtectedRoute>
            <Game5 />
          </ProtectedRoute>
        }
      />
      <Route
        path="/buku"
        element={
          <ProtectedRoute>
            <BukuAdmin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/files"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <FileManager />
          </ProtectedRoute>
        }
      />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
    </Routes>
  )
}

export default AppRoutes
