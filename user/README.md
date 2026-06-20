# SPBKLU Mobile User App (React + Vite + Capacitor)

Ini adalah kode lengkap aplikasi mobile **User APK** untuk platform **SPBKLU** (*Stasiun Penukaran Baterai Kendaraan Listrik Umum*). Proyek ini dirancang menggunakan arsitektur **Vite, ReactJS (JSX)**, dan **TailwindCSS**, lalu dibungkus menggunakan **Capacitor** agar dapat langsung diekspor menjadi file `.apk` asli (Native Android App) atau iOS.

---

## 📱 Fitur Utama Aplikasi User

Aplikasi ini mengadopsi tampilan antarmuka seluler (*mobile-first design*) yang interaktif, premium, dan langsung terhubung secara real-time ke PostgreSQL backend Anda:

1.  **Beranda (Dashboard):**
    *   **Status Baterai Aktif:** Menampilkan persentase daya (*State of Charge* - SOC) dan kesehatan (*State of Health* - SOH) baterai yang sedang dibawa oleh pengendara (`BT-901`). Jika baterai hampir habis, peringatan visual otomatis akan menyala.
    *   **Stasiun Terdekat:** Menampilkan seluruh daftar stasiun SPBKLU aktif di sekitar, lengkap dengan status online/offline dan ketersediaan baterai penuh siap pakai di stasiun tersebut.
2.  **Swapping QR Code (Simulasi Swap):**
    *   User dapat memilih stasiun dan slot charger aktif.
    *   Klik **"Mulai Transaksi Swap!"** akan memicu panggilan aman `POST /api/transactions/swap` ke ExpressJS.
    *   Database PostgreSQL akan menjalankan **ACID transaction**: memotong saldo user sebesar Rp 10.000, memindahkan status baterai penuh menjadi hak milik user, memasukkan baterai kosong ke slot stasiun, memulai pengisian daya, dan mencatat mutasi riwayat.
3.  **Riwayat Transaksi:**
    *   Menampilkan seluruh riwayat transaksi penukaran baterai pribadi pelanggan lengkap dengan nominal biaya, stasiun asal, dan timestamp.
4.  **Profil & Top Up Saldo:**
    *   Menampilkan profil pengendara terverifikasi.
    *   **Fitur Top Up Saldo Dompet Elektrik:** User bisa mengisi ulang saldo dompet digitalnya sendiri. Pengisian saldo ini akan langsung mengupdate record saldo di database PostgreSQL secara instan!

---

## 📁 Struktur Folder & File (`spbklu/user/`)

```text
spbklu/user/
├── public/                     # Static assets publik (ikon, gambar)
├── src/
│   ├── components/             # Komponen UI seluler
│   │   ├── BottomNav.jsx       # Menu tab navigasi bawah (Beranda, Swap, Riwayat, Akun)
│   │   └── Header.jsx          # Bar atas dengan kartu info Saldo Dompet Elektrik
│   ├── context/
│   │   └── AuthContext.jsx     # State manajemen login, register, & refreshProfile user
│   ├── hooks/
│   │   └── useAuth.js          # Hook mengkonsumsi context autentikasi
│   ├── layouts/
│   │   └── AppLayout.jsx       # Layout dasar seluler dengan pembatas BottomNav
│   ├── pages/
│   │   ├── Login.jsx           # Halaman masuk akun pengendara
│   │   ├── Register.jsx        # Pendaftaran akun pelanggan baru
│   │   ├── Home.jsx            # Status baterai pengendara & daftar stasiun SPBKLU terdekat
│   │   ├── SwapQR.jsx          # Panel transaksi penukaran (swap) baterai interaktif
│   │   ├── History.jsx         # Daftar riwayat penukaran baterai pribadi
│   │   └── Profile.jsx         # Profil pengendara & pengisian saldo dompet elektrik
│   ├── services/
│   │   └── api.js              # Instance Axios terhubung ke ExpressJS Backend Anda
│   ├── utils/
│   │   └── formatter.js        # Helper format Rupiah (IDR) & tanggal
│   ├── App.jsx                 # Navigasi & rute utama seluler
│   ├── index.css               # Setup Tailwind & animasi transisi seluler
│   └── main.jsx                # Entry-point React DOM
├── capacitor.config.json       # Berkas konfigurasi utama Capacitor APK
├── package.json                # Daftar dependensi & Capacitor CLI
├── postcss.config.js           # Utilitas styles PostCSS
├── tailwind.config.js          # Konfigurasi Tailwind CSS
└── vite.config.js              # Konfigurasi Vite bundler
```

---

## 🌐 Cara Menghubungkan Aplikasi APK ke Backend Lokal

Saat menguji aplikasi di handphone fisik atau emulator Android, alamat **`localhost` (127.0.0.1)** tidak akan bisa diakses. 

Oleh karena itu, berkas `.env` di aplikasi user ini dikonfigurasi untuk menembak alamat IP Wi-Fi lokal komputer Anda (**`192.168.1.154`**):

1.  **Salin Berkas Konfigurasi:**
    ```bash
    cp .env.example .env
    ```
2.  Buka berkas `.env` tersebut dan pastikan isinya mengarah ke IP Wi-Fi CachyOS Anda:
    ```ini
    VITE_API_URL=http://192.168.1.154:5000/api
    ```

---

## 🛠️ Cara Menjalankan & Membangun APK

### 1. Jalankan Mode Web Development (Untuk Testing di Browser)
```bash
cd spbklu/user
npm install
npm run dev
```
Aplikasi seluler akan berjalan di port **`http://localhost:3001`**. Anda bisa membuka Developer Tools (F12) lalu klik ikon Device Toolbar (Ctrl+Shift+M) untuk melihat visualisasi layar HP.

### 2. Membangun APK Menggunakan Capacitor & Android Studio

Untuk mengekspor proyek ini menjadi aplikasi Android asli (`.apk`), ikuti perintah berikut:

1.  **Build File Produksi Web:**
    ```bash
    npm run build
    ```
2.  **Inisialisasi Folder Android (Hanya satu kali saja):**
    ```bash
    npx cap add android
    ```
3.  **Singkronkan Kode Web ke Folder Android Native:**
    Setiap kali Anda mengubah kode React Anda, jalankan perintah sinkronisasi ini:
    ```bash
    npm run build
    npx cap sync
    ```
4.  **Buka Proyek di Android Studio:**
    Buka Android Studio untuk melakukan kompilasi, membuat emulator, atau ekspor file `.apk` / `.aab` produksi:
    ```bash
    npx cap open android
    ```

Di Android Studio, Anda tinggal menekan tombol **Run** untuk menjalankannya langsung di HP Android fisik Anda yang tersambung melalui USB Debugging!
