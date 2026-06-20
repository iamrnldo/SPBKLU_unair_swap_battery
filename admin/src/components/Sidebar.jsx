import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  Cable,
  QrCode,
  History, 
  Settings, 
  LogOut,
  Zap
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Sidebar = () => {
  const { logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Manajemen User', path: '/users', icon: Users },
    { name: 'Stasiun SPBKLU', path: '/stations', icon: MapPin },
    { name: 'Peta QR Charger', path: '/map', icon: QrCode },
    { name: 'Kabel Charger', path: '/batteries', icon: Cable },
    { name: 'Laporan Transaksi', path: '/transactions', icon: History },
    { name: 'Pengaturan Sistem', path: '/settings', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col min-h-screen border-r border-slate-800">
      {/* Sidebar Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-emerald-500 p-2 rounded-lg text-slate-950">
          <Zap className="h-6 w-6 fill-current" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-wider text-emerald-400">SPBKLU</h1>
          <p className="text-xs text-slate-400">Web Portal Admin</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 group font-medium ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' 
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5 transition-transform duration-150 group-hover:scale-105" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 font-medium transition-all duration-150"
        >
          <LogOut className="h-5 w-5" />
          <span>Keluar (Logout)</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
