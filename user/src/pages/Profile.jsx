import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { formatRupiah } from '../utils/formatter';
import api from '../services/api';
import {
  Wallet,
  LogOut,
  X,
  Check,
  Loader2,
  PlusCircle,
  ShieldCheck,
  AlertCircle,
  QrCode,
  RefreshCw,
  ExternalLink,
  Copy,
  Clock,
  CheckCircle2
} from 'lucide-react';

const formatDateTime = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
};

const Profile = () => {
  const { user, logout, refreshProfile } = useAuth();

  // Topup overlay states
  const [showTopUp, setShowTopUp] = useState(false);
  const [amount, setAmount] = useState('');
  const [payment, setPayment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const resetTopUpModal = () => {
    setShowTopUp(false);
    setAmount('');
    setPayment(null);
    setSuccessMsg('');
    setErrorMsg('');
    setIsSubmitting(false);
    setCheckingPayment(false);
  };

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseInt(amount, 10) <= 0) return;

    setErrorMsg('');
    setSuccessMsg('');
    setPayment(null);
    setIsSubmitting(true);

    try {
      // Create a real Pakasir QRIS payment through backend.
      // The backend stores a pending top-up order and returns the QR image.
      const response = await api.post('/users/topup', {
        amount: parseInt(amount, 10)
      });

      setPayment(response.data.data);
    } catch (error) {
      console.error('Top up failed:', error);
      setErrorMsg(error.response?.data?.message || 'Gagal membuat pembayaran QRIS Pakasir.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkTopUpStatus = async ({ silent = false } = {}) => {
    if (!payment?.orderId) return;

    if (!silent) {
      setCheckingPayment(true);
      setErrorMsg('');
    }

    try {
      const response = await api.get(`/users/topup/${payment.orderId}`);
      const latest = response.data.data;

      setPayment((current) => ({
        ...current,
        ...latest
      }));

      if (latest.status === 'completed') {
        setErrorMsg('');
        setSuccessMsg(`Top up ${formatRupiah(latest.amount)} berhasil. Saldo dompet telah diperbarui.`);
        await refreshProfile();
      } else if (['failed', 'cancelled', 'expired'].includes(latest.status)) {
        setErrorMsg(`Pembayaran berstatus ${latest.status}. Silakan buat top up baru.`);
      } else if (!silent) {
        setErrorMsg('Pembayaran belum diterima. Silakan scan QRIS lalu cek kembali beberapa saat lagi.');
      }
    } catch (error) {
      console.error('Failed to check top up status:', error);
      if (!silent) {
        setErrorMsg(error.response?.data?.message || 'Gagal mengecek status pembayaran.');
      }
    } finally {
      if (!silent) {
        setCheckingPayment(false);
      }
    }
  };

  const simulateSandboxPayment = async () => {
    if (!payment?.orderId) return;

    setCheckingPayment(true);
    setErrorMsg('');

    try {
      const response = await api.post(`/users/topup/${payment.orderId}/simulate`);
      const latest = response.data.data;
      setPayment((current) => ({ ...current, ...latest }));

      if (latest.status === 'completed') {
        setErrorMsg('');
        setSuccessMsg(`Simulasi berhasil. Saldo bertambah ${formatRupiah(latest.amount)}.`);
        await refreshProfile();
      }
    } catch (error) {
      console.error('Sandbox simulation failed:', error);
      setErrorMsg(error.response?.data?.message || 'Gagal menjalankan simulasi pembayaran sandbox.');
    } finally {
      setCheckingPayment(false);
    }
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMsg(`${label} disalin ke clipboard.`);
    } catch (error) {
      setErrorMsg(`Gagal menyalin ${label}.`);
    }
  };

  // Auto-poll pending Pakasir payment status while the QR modal is open.
  useEffect(() => {
    if (!showTopUp || !payment?.orderId || payment.status !== 'pending') return undefined;

    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/users/topup/${payment.orderId}`);
        const latest = response.data.data;
        setPayment((current) => ({ ...current, ...latest }));

        if (latest.status === 'completed') {
          setErrorMsg('');
          setSuccessMsg(`Top up ${formatRupiah(latest.amount)} berhasil. Saldo dompet telah diperbarui.`);
          await refreshProfile();
        }
      } catch (error) {
        console.error('Auto top-up polling failed:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [showTopUp, payment?.orderId, payment?.status]);

  return (
    <div className="min-h-screen bg-slate-50 p-5 pb-24 space-y-6">
      {/* Page Title */}
      <div className="pt-4">
        <h2 className="text-lg font-black text-slate-800 tracking-tight">Akun Pengendara</h2>
        <p className="text-xs font-semibold text-slate-400">Atur profil Anda, isi ulang saldo QRIS, atau keluar akun.</p>
      </div>

      {/* User profile Summary Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
        <div className="h-14 w-14 bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center rounded-full font-black text-lg shadow-md border-2 border-white">
          {user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase() : 'U'}
        </div>
        <div>
          <h3 className="font-extrabold text-slate-800 text-base">{user?.name || 'Pelanggan'}</h3>
          <p className="text-xs text-slate-400 font-semibold">{user?.email || 'user@spbklu.com'}</p>
          <span className="inline-flex items-center gap-0.5 mt-1.5 text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
            <ShieldCheck className="h-3 w-3 fill-current" /> Verified Rider
          </span>
        </div>
      </div>

      {/* Wallet Summary Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Dompet Elektrik</span>
            <span className="text-2xl font-black text-slate-100 tracking-tight">{formatRupiah(user?.balance || 0)}</span>
          </div>
          <button
            onClick={() => setShowTopUp(true)}
            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 font-extrabold text-xs text-slate-950 px-3.5 py-2.5 rounded-xl shadow shadow-emerald-500/10 active:scale-95 transition"
          >
            <PlusCircle className="h-4 w-4" />
            Top Up QRIS
          </button>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-2 text-[10px] font-semibold text-slate-300 leading-relaxed">
          <QrCode className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>Isi saldo otomatis via QRIS Pakasir. Saldo bertambah setelah webhook/status Pakasir mengonfirmasi pembayaran selesai.</span>
        </div>
      </div>

      {/* Secondary System list details */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-3 font-semibold text-slate-700 text-xs">
        <div className="flex justify-between border-b pb-2.5 border-slate-100">
          <span className="text-slate-400">Provider Jaringan</span>
          <span className="text-slate-800 font-bold">SPBKLU Indonesia</span>
        </div>
        <div className="flex justify-between border-b pb-2.5 border-slate-100">
          <span className="text-slate-400">Gateway Pembayaran</span>
          <span className="text-emerald-500 font-extrabold">Pakasir QRIS</span>
        </div>
        <div className="flex justify-between border-b pb-2.5 border-slate-100">
          <span className="text-slate-400">Versi Aplikasi</span>
          <span className="text-slate-800 font-bold">1.0.0 (Capacitor Android)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Database Server Connection</span>
          <span className="text-emerald-500 font-extrabold">Connected OK</span>
        </div>
      </div>

      {/* Logout action block */}
      <button
        onClick={logout}
        className="w-full py-3.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white font-bold text-xs rounded-xl border border-rose-100 hover:border-rose-500 transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        <span>Keluar dari Akun</span>
      </button>

      {/* --- TOP UP MODAL OVERLAY --- */}
      {showTopUp && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[92vh] overflow-y-auto transform transition-all animate-scaleUp">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-500" />
                Isi Ulang Saldo QRIS
              </h3>
              <button
                onClick={resetTopUpModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-700 flex items-start gap-2 text-xs font-bold leading-relaxed">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-600 flex items-start gap-2 text-xs font-bold leading-relaxed">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {!payment ? (
                <form onSubmit={handleTopUpSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Masukkan Nominal Saldo (Rp)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-extrabold text-xs">Rp</span>
                      <input
                        type="number"
                        min="10000"
                        step="10000"
                        required
                        placeholder="Contoh: 50000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Minimum pengisian IDR 10.000 dengan kelipatan IDR 10.000.</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[20000, 50000, 100000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(String(preset))}
                        className="py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:border-emerald-300 hover:text-emerald-600 transition"
                      >
                        {formatRupiah(preset)}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={resetTopUpModal}
                      className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-600 rounded-xl transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !amount}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-white rounded-xl shadow-lg disabled:opacity-50 transition flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Membuat QRIS
                        </>
                      ) : (
                        <>
                          <QrCode className="h-4 w-4 stroke-[3]" />
                          Buat QRIS
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : payment.status === 'completed' ? (
                <div className="text-center py-4 space-y-4">
                  <div className="bg-emerald-500 text-white p-3 rounded-full shadow-lg shadow-emerald-500/20 inline-flex">
                    <Check className="h-8 w-8 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-base">Top Up Berhasil!</h4>
                    <p className="text-xs font-semibold text-slate-500 mt-1">Saldo masuk sebesar {formatRupiah(payment.amount)}.</p>
                  </div>
                  <button
                    onClick={resetTopUpModal}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 font-bold text-xs text-white rounded-xl transition"
                  >
                    Selesai
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                      <Clock className="h-3 w-3" /> Menunggu Pembayaran
                    </div>
                    <h4 className="text-sm font-black text-slate-800">Scan QRIS Pakasir</h4>
                    <p className="text-xs font-semibold text-slate-400">Gunakan aplikasi e-wallet/mobile banking yang mendukung QRIS.</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-center">
                    {payment.qrImage ? (
                      <img src={payment.qrImage} alt="QRIS Pakasir" className="w-60 h-60 rounded-xl bg-white border border-slate-100" />
                    ) : (
                      <div className="w-60 h-60 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                        <QrCode className="h-20 w-20" />
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-600 space-y-2.5">
                    <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                      <span className="text-slate-400">Order ID</span>
                      <button
                        onClick={() => copyToClipboard(payment.orderId, 'Order ID')}
                        className="font-black text-slate-800 text-right flex items-center gap-1 justify-end"
                      >
                        {payment.orderId}
                        <Copy className="h-3 w-3 text-slate-400" />
                      </button>
                    </div>
                    <div className="flex justify-between">
                      <span>Saldo Masuk</span>
                      <span className="font-black text-emerald-600">{formatRupiah(payment.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Biaya Gateway</span>
                      <span className="font-black text-slate-800">{formatRupiah(payment.fee || 0)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2">
                      <span>Total Bayar</span>
                      <span className="font-black text-slate-900 text-sm">{formatRupiah(payment.totalPayment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kadaluarsa</span>
                      <span className="font-black text-amber-600 text-right">{formatDateTime(payment.expiredAt)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => checkTopUpStatus()}
                      disabled={checkingPayment}
                      className="py-2.5 bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-white rounded-xl shadow-lg disabled:opacity-50 transition flex items-center justify-center gap-1.5"
                    >
                      {checkingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Cek Status
                    </button>
                    <a
                      href={payment.checkoutUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-600 rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Buka Pakasir
                    </a>
                  </div>

                  {payment.qrString && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(payment.qrString, 'QR string')}
                      className="w-full py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 font-bold text-xs text-slate-500 rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Copy className="h-4 w-4" />
                      Salin QR String
                    </button>
                  )}

                  {import.meta.env.DEV && (
                    <button
                      type="button"
                      onClick={simulateSandboxPayment}
                      disabled={checkingPayment}
                      className="w-full py-2.5 bg-amber-50 border border-amber-100 hover:bg-amber-100 font-bold text-xs text-amber-700 rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {checkingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Simulasikan Pembayaran Sandbox
                    </button>
                  )}

                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed text-center">
                    Halaman akan mengecek otomatis setiap 5 detik. Jika webhook Pakasir sudah diterima backend, saldo akan bertambah otomatis.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
