import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/Card';
import { 
  Users, 
  MapPin, 
  Battery, 
  History, 
  DollarSign, 
  Zap, 
  TrendingUp, 
  RefreshCw 
} from 'lucide-react';
import { formatRupiah } from '../utils/formatter';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/dashboard-stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Gagal mengambil statistik dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-sm text-slate-500 font-semibold">Memuat Analitik Dashboard...</span>
      </div>
    );
  }

  const { statistics, chartData } = stats || {
    statistics: {
      totalUsers: 0,
      totalStations: 0,
      totalBatteries: 0,
      totalTransactions: 0,
      operationalRate: '0%',
      revenueThisMonth: 0
    },
    chartData: {
      monthlyTransactions: [0, 0, 0, 0, 0, 0],
      monthlyRevenue: [0, 0, 0, 0, 0, 0]
    }
  };

  // Build array for Recharts charts
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];
  const chartCombinedData = months.map((month, idx) => ({
    name: month,
    transaksi: chartData.monthlyTransactions[idx] || 0,
    pendapatan: chartData.monthlyRevenue[idx] || 0
  }));

  return (
    <div className="space-y-8">
      {/* Upper header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Ikhtisar Real-Time</h1>
          <p className="text-sm font-medium text-slate-500">Pantau status stasiun, inventori baterai, dan performa pemesanan swap baterai.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 font-bold text-sm rounded-xl text-slate-700 transition shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          title="Total Pelanggan" 
          value={statistics.totalUsers} 
          icon={Users} 
          description="Pengguna Mobile APK" 
          trend="+12%" 
          color="blue"
        />
        <Card 
          title="Stasiun Swap" 
          value={`${statistics.totalStations} Unit`} 
          icon={MapPin} 
          description="Terpasang di DKI Jakarta" 
          trend="Aktif" 
          color="orange"
        />
        <Card 
          title="Populasi Baterai" 
          value={`${statistics.totalBatteries} Unit`} 
          icon={Battery} 
          description="Baterai siap & siklus swap" 
          trend="Sehat" 
          color="purple"
        />
        <Card 
          title="Omset Bulan Ini" 
          value={formatRupiah(statistics.revenueThisMonth)} 
          icon={DollarSign} 
          description="Pendapatan order swap" 
          trend="+32.4%" 
          color="emerald"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-base font-black text-slate-800 tracking-tight">Tren Pendapatan Bulanan</h4>
              <p className="text-xs font-semibold text-slate-400">Total akumulasi pembayaran order swap baterai (Rupiah)</p>
            </div>
            <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> 2026 Target
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartCombinedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: '600' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `Rp ${v/1000}k`} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: '600' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value) => [formatRupiah(value), 'Pendapatan']} 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Area type="monotone" dataKey="pendapatan" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction Volume Chart (1/3 width) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-6">
            <h4 className="text-base font-black text-slate-800 tracking-tight">Volume Swap</h4>
            <p className="text-xs font-semibold text-slate-400">Jumlah pesanan swap per bulan</p>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartCombinedData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: '600' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: '600' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value) => [value, 'Total Swap']} 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Bar dataKey="transaksi" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Info system block */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
            <Zap className="h-6 w-6 fill-current animate-pulse" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-white">Rasio Efisiensi Operasional SPBKLU: {statistics.operationalRate}</h4>
            <p className="text-xs font-semibold text-slate-400">Seluruh stasiun dalam kondisi optimal. Tidak ada peringatan suhu berlebih saat ini.</p>
          </div>
        </div>
        <div className="text-xs font-bold bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-slate-300">
          Server Database: PostgreSQL 18.4 (Connected)
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
