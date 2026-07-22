import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app/App.jsx'
import AppProviders from './app/AppProviders.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </React.StrictMode>,
)

// Daftarkan service worker supaya app bisa di-install (PWA) dan
// tetap bisa dibuka (aset dasar) walau koneksi lagi jelek.
// Hanya di production build -- saat `npm run dev` dilewati supaya
// tidak mengganggu hot-reload.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Gagal mendaftarkan service worker:', err)
    })
  })
}
