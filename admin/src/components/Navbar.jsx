import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Bell, Shield } from 'lucide-react';

const Navbar = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
      {/* Title / Breadcrumb */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      </div>

      {/* Profile & Notifications */}
      <div className="flex items-center gap-6">
        {/* Notifications mock icon */}
        <button className="text-slate-400 hover:text-slate-600 relative p-1.5 hover:bg-slate-50 rounded-full transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-3 border-l pl-6 border-slate-200">
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-700">{user?.name || 'Administrator'}</span>
            <span className="text-xs font-medium text-slate-400 flex items-center justify-end gap-1">
              <Shield className="h-3 w-3 text-emerald-500 fill-current" /> Admin Portal
            </span>
          </div>

          <div className="h-10 w-10 bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center rounded-full font-bold shadow-md shadow-emerald-500/10 border-2 border-white">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'AD'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
