import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatDate, formatRupiah } from '../utils/formatter';
import { History as HistoryIcon, ArrowDownUp, RefreshCw, Wallet, QrCode, CheckCircle2, Clock, XCircle, BatteryCharging, Cable } from 'lucide-react';

const statusStyle = (status) => {
  switch (status) {
    case 'completed':
      return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    case 'pending':
      return 'text-amber-600 bg-amber-50 border-amber-100';
    case 'charging':
      return 'text-blue-600 bg-blue-50 border-blue-100';
    case 'failed':
    case 'cancelled':
    case 'expired':
      return 'text-rose-600 bg-rose-50 border-rose-100';
    default:
      return 'text-slate-500 bg-slate-50 border-slate-100';
  }
};

const statusLabel = (status) => {
  switch (status) {
    case 'completed':
      return 'Sukses';
    case 'pending':
      return 'Pending';
    case 'charging':
      return 'Charging';
    case 'expired':
      return 'Kadaluarsa';
    case 'cancelled':
      return 'Dibatalkan';
    case 'failed':
      return 'Gagal';
    default:
      return status || '-';
  }
};

const StatusIcon = ({ status }) => {
  if (status === 'completed') return <CheckCircle2 className="h-3 w-3" />;
  if (status === 'pending' || status === 'charging') return <Clock className="h-3 w-3" />;
  return <XCircle className="h-3 w-3" />;
};

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const [swapRes, topupRes, chargingRes] = await Promise.all([
        api.get('/transactions/my-history'),
        api.get('/users/topups'),
        api.get('/charging/my-history')
      ]);

      const swapItems = (swapRes.data.data || []).map((txn) => ({
        type: 'swap',
        id: txn.transactionId,
        timestamp: txn.timestamp,
        data: txn
      }));

      const topupItems = (topupRes.data.data || []).map((topup) => ({
        type: 'topup',
        id: topup.orderId,
        timestamp: topup.completedAt || topup.createdAt,
        data: topup
      }));

      const chargingItems = (chargingRes.data.data || []).map((session) => ({
        type: 'charging',
        id: session.sessionId,
        timestamp: session.completedAt || session.startedAt || session.createdAt,
        data: session
      }));

      const combined = [...swapItems, ...topupItems, ...chargingItems].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setHistory(combined);
    } catch (error) {
      console.error('Failed to load transaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-5 pb-24 space-y-6">
      {/* Title block */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Riwayat Transaksi</h2>
          <p className="text-xs font-semibold text-slate-400">Log charging kendaraan, top up QRIS, dan transaksi dompet Anda.</p>
        </div>
        <button
          onClick={fetchHistory}
          className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-150 rounded-lg transition"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="h-6 w-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="mt-3 text-xs text-slate-400 font-bold">Mengambil Riwayat Transaksi...</span>
        </div>
      ) : history.length > 0 ? (
        <div className="space-y-4">
          {history.map((item) => {
            if (item.type === 'topup') {
              const topup = item.data;
              return (
                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate pr-3">#{topup.orderId}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1 ${statusStyle(topup.status)}`}>
                      <StatusIcon status={topup.status} />
                      {statusLabel(topup.status)}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-emerald-50 text-emerald-500 border border-emerald-100 p-2 rounded-xl">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-black text-slate-800">Top Up Saldo QRIS Pakasir</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{formatDate(topup.completedAt || topup.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 font-bold">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="bg-slate-50 text-slate-500 border px-1.5 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1">
                        <QrCode className="h-3 w-3" /> QRIS
                      </span>
                      <span className="text-[10px] text-slate-400">Total bayar {formatRupiah(topup.totalPayment)}</span>
                    </div>

                    <span className="text-sm font-black text-emerald-600">+{formatRupiah(topup.amount)}</span>
                  </div>
                </div>
              );
            }

            if (item.type === 'charging') {
              const session = item.data;
              return (
                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate pr-3">#{session.sessionId}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1 ${statusStyle(session.status)}`}>
                      <StatusIcon status={session.status} />
                      {statusLabel(session.status)}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-50 text-blue-500 border border-blue-100 p-2 rounded-xl">
                      <BatteryCharging className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-black text-slate-800">Charging Kendaraan</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{formatDate(session.completedAt || session.startedAt || session.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 font-bold">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="bg-slate-50 text-slate-500 border px-1.5 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1">
                        <Cable className="h-3 w-3" /> {session.cableId}
                      </span>
                      <span className="text-[10px] text-slate-400">{(Number(session.estimatedKwh || 0)).toFixed(2)} kWh</span>
                    </div>

                    <span className="text-sm font-black text-slate-800">-{formatRupiah(session.amount)}</span>
                  </div>
                </div>
              );
            }

            const txn = item.data;
            return (
              <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">#{txn.transactionId}</span>
                  <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    Sukses
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-800">{txn.stationName}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">{formatDate(txn.timestamp)}</p>
                </div>

                <div className="flex items-center justify-between pt-1 font-bold">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="bg-rose-50 text-rose-500 border px-1.5 py-0.5 rounded-md text-[10px] font-extrabold">{txn.emptyBatteryId}</span>
                    <ArrowDownUp className="h-3 w-3 text-slate-400" />
                    <span className="bg-emerald-50 text-emerald-500 border px-1.5 py-0.5 rounded-md text-[10px] font-extrabold">{txn.fullBatteryId}</span>
                  </div>

                  <span className="text-sm font-black text-slate-800">-{formatRupiah(txn.cost)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border rounded-2xl p-8 text-center text-slate-400 space-y-3 shadow-sm">
          <div className="h-10 w-10 bg-slate-100 text-slate-300 flex items-center justify-center rounded-full mx-auto border">
            <HistoryIcon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-700 text-sm">Belum Ada Transaksi</h4>
            <p className="text-xs font-semibold text-slate-400 max-w-xs mx-auto mt-0.5">Semua riwayat charging kendaraan dan top up QRIS Anda akan muncul di halaman ini.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
