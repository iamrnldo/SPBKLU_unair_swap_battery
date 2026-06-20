import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import BottomNav from '../components/BottomNav';

const AppLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-xs font-bold text-slate-400">Menyiapkan Aplikasi...</span>
      </div>
    );
  }

  // Redirect to login if user session is absent
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col pb-20 select-none">
      {/* Dynamic Mobile Page Content view */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {/* Persistent Mobile Tab Bar Menu */}
      <BottomNav />
    </div>
  );
};

export default AppLayout;
