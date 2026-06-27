import React from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  LogOut,
  ShieldCheck,
  QrCode,
  User,
  Mail,
  Battery,
  Smartphone
} from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 p-5 pb-24 space-y-6">
      <div className="pt-4">
        <h2 className="text-lg font-black text-slate-800 tracking-tight">Akun Pengendara</h2>
        <p className="text-xs font-semibold text-slate-400">Profil akun untuk pemesanan swap baterai melalui QRIS Pakasir.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
        <div className="h-14 w-14 bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center rounded-full font-black text-lg shadow-md border-2 border-white">
          {user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase() : 'U'}
        </div>
        <div>
          <h3 className="font-extrabold text-slate-800 text-base">{user?.name || 'Pelanggan'}</h3>
          <p className="text-xs text-slate-400 font-semibold">{user?.email || 'user@spbklu.com'}</p>
          <span className="inline-flex items-center gap-0.5 mt-1.5 text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
            <ShieldCheck className="h-3 w-3 fill-current" /> Verified Rider
          </span>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pembayaran</span>
            <span className="text-xl font-black text-slate-100 tracking-tight">QRIS per Pesanan Swap</span>
          </div>
          <div className="bg-white/10 border border-white/10 p-3 rounded-2xl text-emerald-400">
            <QrCode className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-2 text-[10px] font-semibold text-slate-300 leading-relaxed">
          <Battery className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>Pembayaran dilakukan langsung saat membuat pesanan swap baterai. Setelah QRIS berhasil, slot baterai akan terbuka otomatis.</span>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-3 font-semibold text-slate-700 text-xs">
        <div className="flex justify-between border-b pb-2.5 border-slate-100">
          <span className="text-slate-400 flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Role</span>
          <span className="text-slate-800 font-bold">Pengendara</span>
        </div>
        <div className="flex justify-between border-b pb-2.5 border-slate-100">
          <span className="text-slate-400 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</span>
          <span className="text-slate-800 font-bold">{user?.email || '-'}</span>
        </div>
        <div className="flex justify-between border-b pb-2.5 border-slate-100">
          <span className="text-slate-400 flex items-center gap-1.5"><Battery className="h-3.5 w-3.5" /> Flow Aplikasi</span>
          <span className="text-emerald-500 font-extrabold">Pesan Swap + QRIS</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" /> Versi Aplikasi</span>
          <span className="text-slate-800 font-bold">1.0.0</span>
        </div>
      </div>

      <button
        onClick={logout}
        className="w-full py-3.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white font-bold text-xs rounded-xl border border-rose-100 hover:border-rose-500 transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        <span>Keluar dari Akun</span>
      </button>
    </div>
  );
};

export default Profile;
