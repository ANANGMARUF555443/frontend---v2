# Kamus Korea-Indonesia — Frontend

Struktur ini di-organisir **per fitur (feature-based)** supaya beberapa orang
bisa kerja bersamaan tanpa saling bentrok file.

## Struktur folder

```
src/
├── app/                        # "Perekat" aplikasi — jarang diubah
│   ├── App.jsx                 #   shell: background + search + routes
│   ├── AppProviders.jsx        #   semua Context Provider digabung di sini
│   └── routes.jsx              #   daftar semua route/URL
│
├── features/                   # Satu folder = satu fitur = bisa dikerjakan 1 orang
│   ├── auth/                   #   login, register, lupa password, dst
│   │   ├── api.js              #     panggilan API khusus fitur ini
│   │   ├── context/            #     AuthContext (state login, dipakai global)
│   │   └── pages/
│   ├── dashboard/               #   halaman utama, berita, catatan pribadi
│   ├── kosakata/                #   Kosakata Admin (kelola kosakata per bab)
│   ├── buku/                    #   Buku Admin (kelola halaman buku per bab)
│   ├── game/                    #   Game Hub + tiap game (mis. AcakKata)
│   └── file-manager/             #   kelola file R2 + media library
│
├── shared/                      # Dipakai LINTAS fitur — hati-hati mengubahnya
│   ├── components/               #   PixiBackground, GlobalSearch, ProtectedRoute
│   ├── constants/                 #   daftar letak, jumlah bab, dst
│   ├── hooks/                     #   useExitOnBack, dst
│   ├── lib/apiClient.js           #   fungsi request() inti — dipakai SEMUA api.js
│   └── styles/Auth.css            #   gaya form auth, dipakai banyak halaman
│
├── main.jsx
└── index.css
```

## Aturan main biar tidak bentrok

1. **Kerja di fitur sendiri, jangan sentuh fitur lain.**
   Kalau kamu pegang `features/game/`, cukup edit file di situ. Kalau butuh
   data dari fitur lain (misalnya `game` butuh `listKosakata` dari
   `kosakata`), cukup **import** fungsinya — jangan copy-paste logic-nya.

   ```js
   // Contoh di features/game/pages/AcakKata/AcakKataGame.jsx
   import { kosakataApi } from '../../../kosakata/api'
   ```

2. **Setiap fitur punya `api.js` sendiri.**
   Semua fungsi pemanggil backend untuk fitur itu taruh di
   `features/<nama-fitur>/api.js`. Jangan bikin satu `api.js` raksasa lagi —
   itu penyebab bentrok kalau banyak orang kerja bareng.

3. **Ubah `shared/` cuma kalau memang perlu dipakai banyak fitur**, dan kabari
   tim lain karena perubahan di sini bisa memengaruhi fitur lain.

4. **Nambah halaman/route baru** → cukup 2 langkah:
   - Buat file halamannya di `features/<fitur>/pages/`
   - Daftarkan satu baris `<Route>` di `src/app/routes.jsx`

5. **Nambah game baru** (mis. Tata Bahasa) → contoh polanya:
   ```
   features/game/pages/TataBahasa/
   ├── TataBahasaGame.jsx
   └── TataBahasaGame.css
   ```
   lalu tambahkan entrinya di `GameHub.jsx` (daftar `GAMES`) dan satu route
   baru di `routes.jsx`.

## Cek import setelah refactor besar

Kalau kamu memindah-mindah file dan mau memastikan tidak ada import yang
"nyasar" (path salah), jalankan:

```bash
npm run check-imports
```

Script ini akan membaca semua file `.js`/`.jsx` dan memverifikasi setiap
`import './xxx'` benar-benar menunjuk ke file yang ada.

## Menjalankan project

```bash
npm install
npm run dev      # development server
npm run build    # build untuk production (Vercel)
```

Konfigurasi backend URL ada di `.env` (`VITE_API_URL`).
