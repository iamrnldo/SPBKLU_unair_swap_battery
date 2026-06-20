import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Settings, Shield, Server, Coins, Bell, Check, Zap } from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const [flatRate, setFlatRate] = useState('10000');
  const [isSaved, setIsSaved] = useState(false);
  
  // Mock config states
  const [notifSwap, setNotifSwap] = useState(true);
  const [notifTemp, setNotifTemp] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Pengaturan Sistem Global</h1>
        <p className="text-sm font-medium text-slate-500">Konfigurasi parameter operasional SPBKLU, skema tarif swap flat, dan notifikasi sistem.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left column: navigation of settings (1/3 width) */}
        <div className="space-y-4">
          <div className="bg-white border rounded-xl p-4 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Akun Administrator</span>
            <div className="flex items-center gap-3 pt-2">
              <div className="h-10 w-10 bg-emerald-500 text-slate-950 flex items-center justify-center rounded-full font-black text-sm shadow-md">
                AD
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">{user?.name || 'Admin SPBKLU'}</h4>
                <p className="text-xs text-slate-400 font-semibold">{user?.email || 'admin@spbklu.com'}</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-950/20 text-emerald-800 border border-emerald-500/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-600" />
              <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Status Infrastruktur</h5>
            </div>
            <div className="text-xs font-semibold space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Database:</span>
                <span className="font-extrabold text-emerald-600">PostgreSQL 18.4</span>
              </div>
              <div className="flex justify-between">
                <span>Server API:</span>
                <span className="font-extrabold text-emerald-600">ExpressJS (Active)</span>
              </div>
              <div className="flex justify-between">
                <span>CORS Policy:</span>
                <span className="font-extrabold text-emerald-600">Enabled (Client OK)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: form fields (2/3 width) */}
        <div className="md:col-span-2 bg-white border rounded-2xl p-6 shadow-sm space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Subsection 1: Billing and Rates */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
                <Coins className="h-4 w-4 text-emerald-500" /> Skema Tarif Penukaran Flat
              </h3>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Biaya Swap Flat per Transaksi (Rupiah)</label>
                <div className="relative max-w-xs">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-extrabold text-sm">Rp</span>
                  <input
                    type="number"
                    required
                    value={flatRate}
                    onChange={(e) => setFlatRate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-extrabold text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block">Tarif ini akan ditarik dari saldo pelanggan (Mobile APK) setiap kali penukaran berhasil divalidasi stasiun.</span>
              </div>
            </div>

            {/* Subsection 2: Safety & Alerts */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
                <Bell className="h-4 w-4 text-emerald-500" /> Konfigurasi Alarm Keamanan
              </h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifSwap}
                    onChange={(e) => setNotifSwap(e.target.checked)}
                    className="h-4.5 w-4.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Kirim Log Transaksi Real-time ke Terminal Admin</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Tampilkan notifikasi di pojok atas setiap kali ada user melakukan swap baterai.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifTemp}
                    onChange={(e) => setNotifTemp(e.target.checked)}
                    className="h-4.5 w-4.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Peringatan Overheat / Suhu Sel Baterai &gt; 45°C</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Otomatis ubah status stasiun ke "Maintenance" jika sensor mendeteksi anomali panas slot pengisi daya.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit save button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {isSaved ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-150 animate-fade">
                  <Check className="h-4 w-4 stroke-[3]" /> Konfigurasi Berhasil Disimpan!
                </span>
              ) : (
                <span></span>
              )}
              
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-500/10 active:scale-95"
              >
                Simpan Perubahan
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
