import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Table from '../components/Table';
import { formatDate, formatRupiah } from '../utils/formatter';
import { Search, History, CheckCircle, RefreshCw, AlertTriangle, ArrowRightLeft, BatteryCharging, Cable } from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const [swapRes, chargingRes] = await Promise.all([
        api.get('/transactions/all'),
        api.get('/charging/all')
      ]);

      const swapItems = (swapRes.data.data || []).map((txn) => ({
        type: 'swap',
        id: txn.transactionId,
        timestamp: txn.timestamp,
        userName: txn.userName,
        stationName: txn.stationName,
        status: txn.status,
        amount: txn.cost,
        data: txn
      }));

      const chargingItems = (chargingRes.data.data || []).map((session) => ({
        type: 'charging',
        id: session.sessionId,
        timestamp: session.completedAt || session.startedAt || session.createdAt,
        userName: session.userName,
        stationName: session.stationName,
        status: session.status,
        amount: session.amount,
        data: session
      }));

      setTransactions([...swapItems, ...chargingItems].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
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
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle className="h-3 w-3 fill-current" /> Berhasil
          </span>
        );
      case 'charging':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
            <BatteryCharging className="h-3 w-3" /> Charging
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">
            <AlertTriangle className="h-3 w-3" /> Gagal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-600 border border-slate-100">
            {status}
          </span>
        );
    }
  };

  const filteredTransactions = transactions.filter((item) => {
    const keyword = searchQuery.toLowerCase();
    return (
      item.id?.toLowerCase().includes(keyword) ||
      item.userName?.toLowerCase().includes(keyword) ||
      item.stationName?.toLowerCase().includes(keyword) ||
      item.data?.cableId?.toLowerCase().includes(keyword) ||
      item.data?.cableName?.toLowerCase().includes(keyword) ||
      item.data?.emptyBatteryId?.toLowerCase().includes(keyword) ||
      item.data?.fullBatteryId?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="space-y-6">
      {/* Upper Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Laporan & Riwayat Transaksi</h1>
          <p className="text-sm font-medium text-slate-500">Daftar log charging kendaraan, top up operasional, dan transaksi legacy swap baterai.</p>
        </div>
        <button
          onClick={fetchTransactions}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 font-bold text-sm rounded-xl text-slate-700 transition shadow-sm active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Log
        </button>
      </div>

      {/* Filter and stats overview */}
      <div className="flex bg-white p-4 border border-slate-200 rounded-xl shadow-sm justify-between items-center gap-4">
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="h-5 w-5" />
          </span>
          <input
            type="text"
            placeholder="Cari pelanggan, stasiun, kabel charger, atau ID transaksi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-sm font-semibold transition-all"
          />
        </div>

        <div className="text-xs font-bold text-slate-400 bg-slate-50 border px-3 py-1.5 rounded-lg">
          Total Rekaman: <span className="text-slate-700 font-extrabold">{transactions.length} Transaksi</span>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="mt-4 text-sm text-slate-500 font-semibold">Mengambil Data Log Transaksi...</span>
        </div>
      ) : (
        <Table
          headers={['ID Transaksi', 'Jenis', 'Nama Pelanggan', 'Lokasi/Stasiun', 'Detail Energi/Unit', 'Biaya', 'Status', 'Tanggal & Waktu']}
          emptyMessage="Tidak ada catatan transaksi yang cocok."
        >
          {filteredTransactions.map((item) => {
            const isCharging = item.type === 'charging';
            const data = item.data;

            return (
              <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-extrabold text-slate-400 text-xs">#{item.id}</td>
                <td className="px-6 py-4">
                  {isCharging ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                      <BatteryCharging className="h-3.5 w-3.5" /> Charging
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600 border border-purple-100">
                      <ArrowRightLeft className="h-3.5 w-3.5" /> Legacy Swap
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 font-extrabold text-slate-800 text-sm">{item.userName || '-'}</td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                  <div className="flex flex-col">
                    <span>{item.stationName || '-'}</span>
                    <span className="text-[10px] text-slate-400 font-bold">STATION ID: {data.stationId || '-'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {isCharging ? (
                    <div className="flex flex-col gap-1 text-xs font-extrabold text-slate-700">
                      <span className="bg-slate-50 text-slate-600 px-2 py-1 rounded-md border inline-flex items-center gap-1 w-fit">
                        <Cable className="h-3.5 w-3.5" /> {data.cableId}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">{Number(data.estimatedKwh || 0).toFixed(2)} kWh • {data.requestedWatt} Wh</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                      <span className="bg-rose-50 text-rose-600 px-2 py-1 rounded-md border border-rose-150">
                        {data.emptyBatteryId}
                      </span>
                      <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400" />
                      <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md border border-emerald-150">
                        {data.fullBatteryId}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 font-black text-slate-800 text-sm">
                  {formatRupiah(item.amount || 0)}
                </td>
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
