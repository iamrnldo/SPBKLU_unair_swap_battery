import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Scan, History, User } from 'lucide-react';

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-150 flex items-center justify-around pb-safe z-30 shadow-lg shadow-slate-900/10">
      {/* Home Page Link */}
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-xs font-bold transition-colors ${
            isActive ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'
          }`
        }
      >
        <Home className="h-5 w-5" />
        <span>Beranda</span>
      </NavLink>

      {/* SWAP QR CODE ACTION LINK (Middle main button) */}
      <NavLink
        to="/swap-qr"
        className={({ isActive }) =>
          `relative -top-4 bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950 p-4 rounded-full shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 flex items-center justify-center border-4 border-white ${
            isActive ? 'ring-4 ring-emerald-500/20' : ''
          }`
        }
      >
        <Scan className="h-6 w-6 stroke-[3]" />
      </NavLink>

      {/* History Transactions Link */}
      <NavLink
        to="/history"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-xs font-bold transition-colors ${
            isActive ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'
          }`
        }
      >
        <History className="h-5 w-5" />
        <span>Riwayat</span>
      </NavLink>

      {/* Profile Page Link */}
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-xs font-bold transition-colors ${
            isActive ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'
          }`
        }
      >
        <User className="h-5 w-5" />
        <span>Akun</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
