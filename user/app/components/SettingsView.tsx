import { Bell, Globe, Moon, Lock, HelpCircle, Info, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function SettingsView() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h2 className="mb-6">Pengaturan</h2>

      {/* General Settings */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3>Umum</h3>
        </div>

        <div className="divide-y divide-border">
          <button className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p>Bahasa</p>
                <p className="text-sm text-muted-foreground">Indonesia</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-muted-foreground" />
              <div>
                <p>Mode Gelap</p>
                <p className="text-sm text-muted-foreground">Tema gelap otomatis</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3>Notifikasi</h3>
        </div>

        <div className="divide-y divide-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <p>Notifikasi Push</p>
                <p className="text-sm text-muted-foreground">Terima pembaruan penting</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <button className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p>Preferensi Notifikasi</p>
                <p className="text-sm text-muted-foreground">Atur jenis notifikasi</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3>Keamanan</h3>
        </div>

        <div className="divide-y divide-border">
          <button className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p>Ubah Password</p>
                <p className="text-sm text-muted-foreground">Perbarui kata sandi Anda</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p>Verifikasi Dua Faktor</p>
                <p className="text-sm text-muted-foreground">Tambah keamanan ekstra</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Support */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3>Dukungan</h3>
        </div>

        <div className="divide-y divide-border">
          <button className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p>Pusat Bantuan</p>
                <p className="text-sm text-muted-foreground">FAQ dan panduan</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p>Tentang Aplikasi</p>
                <p className="text-sm text-muted-foreground">Versi 1.0.0</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card rounded-lg border border-destructive/50 overflow-hidden">
        <div className="p-4 border-b border-destructive/50">
          <h3 className="text-destructive">Zona Berbahaya</h3>
        </div>

        <div className="p-4">
          <button className="w-full py-3 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity">
            Hapus Akun
          </button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Tindakan ini tidak dapat dibatalkan
          </p>
        </div>
      </div>
    </div>
  );
}
