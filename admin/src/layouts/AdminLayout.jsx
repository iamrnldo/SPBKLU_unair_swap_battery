import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-sm font-semibold text-slate-500">Memuat Sesi Admin...</span>
      </div>
    );
  }

  // Redirect to Login if not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Map paths to beautiful headers
  const getHeaderTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard & Statistik';
      case '/users':
        return 'Manajemen Akun User';
      case '/stations':
        return 'Manajemen Stasiun SPBKLU';
      case '/batteries':
        return 'Database Baterai Swap';
      case '/transactions':
        return 'Laporan Transaksi Swap Baterai';
      case '/settings':
        return 'Pengaturan Sistem Global';
      default:
        return 'Portal Admin SPBKLU';
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      {/* Permanent Left Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Layout Block */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header Navigation Bar */}
        <Navbar title={getHeaderTitle()} />

        {/* Dynamic Nested Content Page */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
