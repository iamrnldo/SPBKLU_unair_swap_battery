import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Table from '../components/Table';
import { formatDate, formatRupiah } from '../utils/formatter';
import { Search, CheckCircle, RefreshCw, AlertTriangle, ArrowRightLeft, Clock } from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/transactions/all');
      const items = (response.data.data || []).map((txn) => ({
        id: txn.transactionId,
        timestamp: txn.releasedAt || txn.paidAt || txn.timestamp || txn.createdAt,
        userName: txn.userName,
        stationName: txn.stationName,
        status: txn.status,
        amount: txn.totalPayment || txn.cost,
        data: txn
      }));
      setTransactions(items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) {
      console.error('Gagal mengambil data transaksi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100"><CheckCircle className="h-3 w-3 fill-current" /> Berhasil / Terlepas</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100"><Clock className="h-3 w-3" /> Menunggu Bayar</span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100"><AlertTriangle className="h-3 w-3" /> Gagal</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-600 border border-slate-100">{status}</span>;
    }
  };

  const filteredTransactions = transactions.filter((item) => {
    const keyword = searchQuery.toLowerCase();
    const data = item.data;
    return (
      item.id?.toLowerCase().includes(keyword) ||
      item.userName?.toLowerCase().includes(keyword) ||
      item.stationName?.toLowerCase().includes(keyword) ||
      data.emptyBatteryId?.toLowerCase().includes(keyword) ||
      data.fullBatteryId?.toLowerCase().includes(keyword) ||
      data.releaseCode?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Laporan Pesanan Swap Baterai</h1>
          <p className="text-sm font-medium text-slate-500">Daftar pemesanan baterai, status pembayaran QRIS, dan riwayat pelepasan slot.</p>
        </div>
        <button onClick={fetchTransactions} className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 font-bold text-sm rounded-xl text-slate-700 transition shadow-sm active:scale-95">
          <RefreshCw className="h-4 w-4" /> Refresh Log
        </button>
      </div>

      <div className="flex bg-white p-4 border border-slate-200 rounded-xl shadow-sm justify-between items-center gap-4">
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Search className="h-5 w-5" /></span>
          <input type="text" placeholder="Cari pelanggan, stasiun, baterai, release code, atau ID transaksi..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-sm font-semibold transition-all" />
        </div>
        <div className="text-xs font-bold text-slate-400 bg-slate-50 border px-3 py-1.5 rounded-lg">Total Rekaman: <span className="text-slate-700 font-extrabold">{transactions.length} Transaksi</span></div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center"><div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div><span className="mt-4 text-sm text-slate-500 font-semibold">Mengambil Data Log Transaksi...</span></div>
      ) : (
        <Table headers={['ID Transaksi', 'Jenis', 'Nama Pelanggan', 'Lokasi/Stasiun', 'Baterai Masuk → Keluar', 'Biaya', 'Status', 'Tanggal & Waktu']} emptyMessage="Tidak ada catatan transaksi yang cocok.">
          {filteredTransactions.map((item) => {
            const data = item.data;
            return (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-extrabold text-slate-400 text-xs">#{item.id}</td>
                <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600 border border-purple-100"><ArrowRightLeft className="h-3.5 w-3.5" /> Order Swap</span></td>
                <td className="px-6 py-4 font-extrabold text-slate-800 text-sm">{item.userName || '-'}</td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-700"><div className="flex flex-col"><span>{item.stationName || '-'}</span><span className="text-[10px] text-slate-400 font-bold">STATION ID: {data.stationId || '-'} • SLOT {data.slotId || '-'}</span></div></td>
                <td className="px-6 py-4"><div className="flex items-center gap-2 text-xs font-extrabold text-slate-700"><span className="bg-rose-50 text-rose-600 px-2 py-1 rounded-md border border-rose-150">{data.emptyBatteryId}</span><ArrowRightLeft className="h-3.5 w-3.5 text-slate-400" /><span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md border border-emerald-150">{data.fullBatteryId}</span></div><div className="text-[10px] text-slate-400 font-bold mt-1">Release: {data.releaseCode || '-'}</div></td>
                <td className="px-6 py-4 font-black text-slate-800 text-sm">{formatRupiah(item.amount || 0)}</td>
                <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                <td className="px-6 py-4 text-slate-500 text-xs font-bold">{formatDate(item.timestamp)}</td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
};

export default Transactions;
