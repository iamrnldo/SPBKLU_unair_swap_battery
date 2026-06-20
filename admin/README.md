# SPBKLU Web Admin Frontend (Vite + ReactJS + TailwindCSS)

Ini adalah struktur folder frontend **Web Admin** untuk platform **SPBKLU** (*Stasiun Penukaran Baterai Kendaraan Listrik Umum*). Proyek ini dipersiapkan menggunakan boilerplate modern **Vite, ReactJS (JSX)**, dan **TailwindCSS** untuk proses pengembangan yang cepat dan optimal.

Sesuai permintaan Anda, folder dan file di dalam folder `spbklu/admin` saat ini didefinisikan sebagai struktur **kerangka (root folders & placeholder files)** kosong yang siap diisi dengan kode fungsional Anda sendiri di kemudian hari.

---

## 📁 Struktur Folder & File Frontend Admin

```text
spbklu/admin/
├── public/                     # Static assets publik (favicon, logo, dll.)
├── src/
│   ├── assets/                 # Gambar, ikon, dan aset statis ter-bundling
│   ├── components/             # Komponen UI reusable / mandiri
│   │   ├── Card.jsx            # Kartu metrik ringkasan KPI dashboard
│   │   ├── Navbar.jsx          # Bar navigasi atas (profil admin, logout)
│   │   ├── Sidebar.jsx         # Menu navigasi samping utama
│   │   └── Table.jsx           # Komponen tabel data dinamis
│   ├── context/                # State management global
│   │   └── AuthContext.jsx     # Menyimpan JWT Token & fungsi login/logout admin
│   ├── hooks/                  # Custom React Hooks
│   │   └── useAuth.js          # Hook helper mengkonsumsi data AuthContext
│   ├── layouts/                # Template layout halaman
│   │   └── AdminLayout.jsx     # Membungkus halaman dengan struktur Sidebar + Navbar
│   ├── pages/                  # Komponen halaman (Views) utama
│   │   ├── Login.jsx           # Halaman masuk sistem Admin
│   │   ├── Dashboard.jsx       # Statistik, ringkasan metrics, grafik penjualan
│   │   ├── Users.jsx           # Manajemen data pengguna / pelanggan SPBKLU
│   │   ├── Stations.jsx        # Pengelolaan data stasiun tukar baterai & slot charger
│   │   ├── Batteries.jsx       # Diagnostik SOC & SOH kesehatan baterai
│   │   ├── Transactions.jsx    # Laporan / rekonsiliasi log transaksi swap baterai
│   │   └── Settings.jsx        # Pengaturan sistem dan tarif biaya swap flat
│   ├── services/               # Layanan integrasi API backend
│   │   └── api.js              # Konfigurasi instance Axios & interceptors token
│   ├── utils/                  # Helper utilities umum
│   │   └── formatter.js        # Formatter mata uang rupiah (IDR), angka, dan tanggal
│   ├── App.css                 # CSS custom global
│   ├── App.jsx                 # Router & inisialisasi context provider utama
│   ├── index.css               # Setup Tailwind directives (@tailwind base, dll.)
│   └── main.jsx                # Entry-point pemasangan React ke DOM index.html
├── .env.example                # Template konfigurasi environment variables frontend
├── .gitignore                  # Berkas pengecualian Git
├── index.html                  # File HTML utama tempat injeksi React app
├── package.json                # Daftar dependensi modul frontend & build scripts
├── postcss.config.js           # Konfigurasi utility loader postcss
├── tailwind.config.js          # Pengaturan setup breakpoints & theme Tailwind CSS
└── vite.config.js              # Berkas konfigurasi bundler utama Vite
```

---

## 🚀 Fitur Utama Halaman Admin

1.  **Dashboard:** Menampilkan diagram charts (transaksi & pendapatan), jumlah total pengguna aktif, jumlah stasiun SPBKLU, total unit baterai, dan rata-rata operasional sistem.
2.  **Manajemen User:** Berfungsi untuk mendaftar, mengedit, memblokir, atau mengisi ulang (*manual top up*) saldo para pengguna aplikasi mobile APK.
3.  **Manajemen Stasiun (SPBKLU):** Mengawasi status kesehatan stasiun pengisi daya, melacak stasiun yang butuh perbaikan (*maintenance*), dan menambahkan unit stasiun SPBKLU baru secara dinamis ke peta.
4.  **Laporan / Statistik (Transaksi):** Ekspor log riwayat seluruh transaksi penukaran baterai lengkap dengan informasi biaya, waktu pertukaran, dan ID baterai yang terlibat.
5.  **Pengaturan Sistem:** Mengkonfigurasi parameter global seperti tarif dasar swap flat (misal: IDR 10.000 per transaksi) dan data konfigurasi sistem admin lainnya.

---

## ⚙️ Cara Memulai Development

Jika Anda ingin mulai mengisinya dan menginstall dependensi dasar (React Router, Axios, Tailwind, dll.), jalankan perintah berikut:

```bash
cd spbklu/admin
npm install
npm run dev
```

Aplikasi admin akan berjalan pada port default Vite di **`http://localhost:3000`**!
