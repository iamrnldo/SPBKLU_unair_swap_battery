import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { formatRupiah } from '../utils/formatter';
import { Zap, Wallet } from 'lucide-react';

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 pt-4 pb-5 rounded-b-[2rem] shadow-md z-20">
      <div className="flex items-center justify-between">
        {/* Brand App Logotype */}
        <div className="flex items-center gap-2">
          <div className="bg-white/15 p-1.5 rounded-lg">
            <Zap className="h-5 w-5 fill-current text-white" />
          </div>
          <span className="font-extrabold tracking-wider text-base text-white">SPBKLU Mobile</span>
        </div>

        {/* Hello Guest/User Greeting */}
        <div className="text-right">
          <span className="text-[10px] font-bold opacity-80 uppercase block">Halo Pengendara,</span>
          <span className="text-xs font-black text-white">{user?.name ? user.name.split(' ')[0] : 'Tamu'}</span>
        </div>
      </div>

      {/* Wallet Balance Widget Card */}
      <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/15 text-white rounded-xl">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold opacity-85 uppercase tracking-wider block">Saldo Dompet Elektrik</span>
            <span className="text-lg font-black tracking-tight">{formatRupiah(user?.balance || 0)}</span>
          </div>
        </div>

        <div className="text-[10px] font-extrabold bg-white text-emerald-600 px-3 py-1.5 rounded-xl shadow-sm">
          Active
        </div>
      </div>
    </header>
  );
};

export default Header;
