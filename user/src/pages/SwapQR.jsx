import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatRupiah } from '../utils/formatter';
import {
  Scan,
  Battery,
  BatteryCharging,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  MapPin,
  RefreshCw,
  QrCode,
  ExternalLink,
  Copy,
  Clock,
  Unlock,
  ArrowDownUp,
  Zap
} from 'lucide-react';

const ACTIVE_SWAP_ORDER_KEY = 'spbklu_active_swap_order';

const formatDateTime = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
};

const SwapQR = () => {
  const { user, refreshProfile } = useAuth();

  const [stations, setStations] = useState([]);
  const [activeBattery, setActiveBattery] = useState(null);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [emptyBatteryId, setEmptyBatteryId] = useState('');

  const [paymentOrder, setPaymentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const selectedStation = stations.find((station) => station.id === selectedStationId);
  const readySlots = useMemo(() => {
    return selectedStation?.slots?.filter((slot) => slot.status === 'ready' && slot.batteryId) || [];
  }, [selectedStation]);

  const selectedSlot = readySlots.find((slot) => String(slot.slotId) === String(selectedSlotId));

  const fetchInitialData = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const [stationsRes, batteryRes, activeOrderRes] = await Promise.all([
        api.get('/stations'),
        api.get('/users/my-battery'),
        api.get('/transactions/swap-order/active')
      ]);

      const activeStations = (stationsRes.data.data || []).filter((station) => station.status === 'active');
      setStations(activeStations);

      const heldBattery = batteryRes.data.data || null;
      setActiveBattery(heldBattery);
      if (heldBattery?.id) {
        setEmptyBatteryId(heldBattery.id);
      }

      const activeOrder = activeOrderRes.data.data;
      if (activeOrder?.status === 'pending') {
        setPaymentOrder(activeOrder);
        localStorage.setItem(ACTIVE_SWAP_ORDER_KEY, JSON.stringify(activeOrder));
      } else {
        localStorage.removeItem(ACTIVE_SWAP_ORDER_KEY);
      }

      await refreshProfile();
    } catch (error) {
      console.error('Failed to load swap order data:', error);
      const cachedOrder = localStorage.getItem(ACTIVE_SWAP_ORDER_KEY);
      if (cachedOrder) {
        try {
          setPaymentOrder(JSON.parse(cachedOrder));
          setErrorMsg('Gagal menghubungi server. Pesanan pending terakhir ditampilkan dari cache lokal. Hubungkan kembali untuk cek status pembayaran.');
        } catch (_) {
          localStorage.removeItem(ACTIVE_SWAP_ORDER_KEY);
        }
      } else {
        setErrorMsg(error.response?.data?.message || 'Gagal memuat data swap baterai.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!paymentOrder?.transactionId || paymentOrder.status !== 'pending') return undefined;

    const interval = setInterval(() => {
      checkPaymentStatus({ silent: true });
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentOrder?.transactionId, paymentOrder?.status]);

  const resetOrderFlow = () => {
    localStorage.removeItem(ACTIVE_SWAP_ORDER_KEY);
    setPaymentOrder(null);
    setSuccessMsg('');
    setErrorMsg('');
    setSelectedStationId('');
    setSelectedSlotId('');
  };

  const createSwapOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedStationId || !selectedSlotId || !emptyBatteryId) {
      setErrorMsg('Pilih stasiun, slot baterai penuh, dan ID baterai habis terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/transactions/swap-order', {
        stationId: selectedStationId,
        slotId: parseInt(selectedSlotId, 10),
        emptyBatteryId
      });

      const order = response.data.data;
      setPaymentOrder(order);
      localStorage.setItem(ACTIVE_SWAP_ORDER_KEY, JSON.stringify(order));
      setSuccessMsg('Pesanan dibuat. Scan QRIS untuk membuka slot baterai.');
    } catch (error) {
      console.error('Failed to create swap order:', error);
      setErrorMsg(error.response?.data?.message || 'Gagal membuat pesanan swap baterai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkPaymentStatus = async ({ silent = false } = {}) => {
    if (!paymentOrder?.transactionId) return;

    if (!silent) {
      setChecking(true);
      setErrorMsg('');
      setSuccessMsg('');
    }

    try {
      const response = await api.get(`/transactions/swap-order/${paymentOrder.transactionId}`);
      const latest = response.data.data;
      setPaymentOrder(latest);

      if (latest.status === 'pending') {
        localStorage.setItem(ACTIVE_SWAP_ORDER_KEY, JSON.stringify(latest));
        if (!silent) setErrorMsg('Pembayaran belum diterima. Silakan selesaikan pembayaran QRIS.');
      } else if (latest.status === 'completed') {
        localStorage.removeItem(ACTIVE_SWAP_ORDER_KEY);
        setSuccessMsg('Pembayaran berhasil. Slot baterai sudah terbuka otomatis.');
        await refreshProfile();
      } else if (latest.status === 'failed') {
        localStorage.removeItem(ACTIVE_SWAP_ORDER_KEY);
        setErrorMsg('Pesanan gagal/kadaluarsa. Silakan buat pesanan baru.');
      }
    } catch (error) {
      console.error('Failed to check swap payment:', error);
      if (!silent) setErrorMsg(error.response?.data?.message || 'Gagal mengecek status pembayaran.');
    } finally {
      if (!silent) setChecking(false);
    }
  };

  const simulatePayment = async () => {
    if (!paymentOrder?.transactionId) return;
    setChecking(true);
    setErrorMsg('');

    try {
      const response = await api.post(`/transactions/swap-order/${paymentOrder.transactionId}/simulate`);
      const latest = response.data.data;
      setPaymentOrder(latest);
      localStorage.removeItem(ACTIVE_SWAP_ORDER_KEY);
      setSuccessMsg('Simulasi pembayaran berhasil. Slot baterai sudah terbuka otomatis.');
      await refreshProfile();
    } catch (error) {
      console.error('Failed to simulate swap payment:', error);
      setErrorMsg(error.response?.data?.message || 'Gagal menjalankan simulasi pembayaran.');
    } finally {
      setChecking(false);
    }
  };

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMsg(`${label} disalin.`);
    } catch (_) {
      setErrorMsg(`Gagal menyalin ${label}.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-5 pb-24 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="mt-3 text-xs text-slate-400 font-bold">Memuat Pemesanan Swap Baterai...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-5 pb-24 space-y-6">
      <div className="text-center pt-4 space-y-1">
        <div className="inline-flex bg-emerald-50 text-emerald-500 border border-emerald-100 p-2.5 rounded-2xl mb-1">
          <Scan className="h-6 w-6 stroke-[3]" />
        </div>
        <h2 className="text-lg font-black text-slate-800 tracking-tight">Pesan Swap Baterai</h2>
        <p className="text-xs font-semibold text-slate-400">Pilih baterai penuh, bayar QRIS di aplikasi, lalu slot akan terbuka otomatis.</p>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-rose-600 flex items-start gap-2 text-xs font-bold leading-relaxed">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
          <div>{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-emerald-700 flex items-start gap-2 text-xs font-bold leading-relaxed">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <div>{successMsg}</div>
        </div>
      )}

      {paymentOrder?.status === 'completed' ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-xl space-y-5">
          <div className="bg-emerald-500 text-white p-3 rounded-full shadow-lg shadow-emerald-500/20 inline-flex">
            <Unlock className="h-10 w-10" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800">Baterai Terlepas Otomatis</h3>
            <p className="text-xs font-semibold text-emerald-600 mt-1">Pembayaran berhasil. Silakan ambil baterai penuh dan masukkan baterai habis Anda.</p>
          </div>

          <div className="bg-slate-50 p-4 border rounded-xl text-left text-xs font-semibold space-y-2 text-slate-600">
            <div className="flex justify-between border-b pb-2 border-slate-200/80">
              <span className="text-slate-400">ID TRANSAKSI</span>
              <span className="font-extrabold text-slate-800">#{paymentOrder.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span>Stasiun</span>
              <span className="font-extrabold text-slate-800 text-right">{paymentOrder.stationName}</span>
            </div>
            <div className="flex justify-between">
              <span>Slot Terbuka</span>
              <span className="font-extrabold text-emerald-600">Slot {paymentOrder.slotId}</span>
            </div>
            <div className="flex justify-between">
              <span>Baterai Diambil</span>
              <span className="font-extrabold text-emerald-600">{paymentOrder.fullBatteryId}</span>
            </div>
            <div className="flex justify-between">
              <span>Baterai Habis Masuk</span>
              <span className="font-extrabold text-rose-500">{paymentOrder.emptyBatteryId}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200/80">
              <span>Kode Release</span>
              <span className="font-black text-slate-900">{paymentOrder.releaseCode || '-'}</span>
            </div>
          </div>

          <button onClick={resetOrderFlow} className="w-full py-3 bg-slate-900 text-white font-black text-sm rounded-xl shadow transition">
            Pesan Swap Lagi
          </button>
        </div>
      ) : paymentOrder?.status === 'pending' ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-full text-[10px] font-black uppercase">
              <Clock className="h-3 w-3" /> Menunggu Pembayaran
            </div>
            <h3 className="text-sm font-black text-slate-800">Scan QRIS Pakasir</h3>
            <p className="text-xs font-semibold text-slate-400">Setelah pembayaran sukses, slot baterai akan terbuka otomatis.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-center">
            {paymentOrder.qrImage ? (
              <img src={paymentOrder.qrImage} alt="QRIS Pembayaran Swap" className="w-60 h-60 rounded-xl bg-white border border-slate-100" />
            ) : (
              <div className="w-60 h-60 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                <QrCode className="h-20 w-20" />
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-600 space-y-2.5">
            <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
              <span className="text-slate-400">Order ID</span>
              <button onClick={() => copyText(paymentOrder.transactionId, 'Order ID')} className="font-black text-slate-800 text-right flex items-center gap-1 justify-end">
                {paymentOrder.transactionId}
                <Copy className="h-3 w-3 text-slate-400" />
              </button>
            </div>
            <div className="flex justify-between"><span>Stasiun</span><span className="font-black text-slate-800 text-right">{paymentOrder.stationName}</span></div>
            <div className="flex justify-between"><span>Slot/Baterai</span><span className="font-black text-emerald-600">Slot {paymentOrder.slotId} • {paymentOrder.fullBatteryId}</span></div>
            <div className="flex justify-between"><span>Baterai habis</span><span className="font-black text-rose-500">{paymentOrder.emptyBatteryId}</span></div>
            <div className="flex justify-between border-t border-slate-100 pt-2"><span>Total Bayar</span><span className="font-black text-slate-900 text-sm">{formatRupiah(paymentOrder.totalPayment)}</span></div>
            <div className="flex justify-between"><span>Kadaluarsa</span><span className="font-black text-amber-600 text-right">{formatDateTime(paymentOrder.expiredAt)}</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => checkPaymentStatus()} disabled={checking} className="py-2.5 bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-white rounded-xl shadow-lg disabled:opacity-50 transition flex items-center justify-center gap-1.5">
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Cek Status
            </button>
            {paymentOrder.checkoutUrl ? (
              <a href={paymentOrder.checkoutUrl} target="_blank" rel="noreferrer" className="py-2.5 border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-600 rounded-xl transition flex items-center justify-center gap-1.5">
                <ExternalLink className="h-4 w-4" /> Buka Pakasir
              </a>
            ) : (
              <button type="button" onClick={() => copyText(paymentOrder.qrString || '', 'QR String')} className="py-2.5 border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-600 rounded-xl transition flex items-center justify-center gap-1.5">
                <Copy className="h-4 w-4" /> Salin QR
              </button>
            )}
          </div>

          {import.meta.env.DEV && (
            <button type="button" onClick={simulatePayment} disabled={checking} className="w-full py-2.5 bg-amber-50 border border-amber-100 hover:bg-amber-100 font-bold text-xs text-amber-700 rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50">
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Simulasikan Pembayaran Sandbox
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={createSwapOrder} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-start gap-3">
            <div className="bg-white/10 text-emerald-400 border border-white/10 p-2 rounded-xl">
              <Battery className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Baterai yang Anda bawa</span>
              <h3 className="font-black text-white text-sm mt-0.5">{activeBattery?.id || emptyBatteryId || 'Belum terdeteksi'}</h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-1">Baterai ini akan dimasukkan ke slot setelah baterai penuh terlepas.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">1. ID Baterai Habis / Yang Akan Diganti</label>
            <input
              value={emptyBatteryId}
              onChange={(e) => setEmptyBatteryId(e.target.value)}
              placeholder="Contoh: BT-901"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-extrabold text-sm focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">2. Pilih Lokasi Stasiun</label>
            <select value={selectedStationId} onChange={(e) => { setSelectedStationId(e.target.value); setSelectedSlotId(''); }} className="w-full px-4 py-3 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm focus:outline-none">
              <option value="">-- Pilih Stasiun --</option>
              {stations.map((station) => <option key={station.id} value={station.id}>{station.name} ({station.id})</option>)}
            </select>
          </div>

          {selectedStationId && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">3. Pilih Baterai Penuh Siap Ambil</label>
              {readySlots.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {readySlots.map((slot) => (
                    <button
                      key={slot.slotId}
                      type="button"
                      onClick={() => setSelectedSlotId(String(slot.slotId))}
                      className={`p-3 border rounded-xl text-left transition-all ${selectedSlotId === String(slot.slotId) ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10' : 'border-slate-200 bg-slate-50'}`}
                    >
                      <span className="text-[9px] font-black text-slate-400 uppercase block">Slot {slot.slotId}</span>
                      <span className="text-xs font-extrabold text-slate-800 block mt-0.5">{slot.batteryId}</span>
                      <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 rounded-md inline-flex items-center gap-1 mt-1.5">
                        <BatteryCharging className="h-3 w-3" /> {slot.chargeLevel || 100}%
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center text-xs font-bold text-orange-600">Tidak ada baterai penuh yang siap diambil di stasiun ini.</div>
              )}
            </div>
          )}

          {selectedSlot && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs font-semibold text-emerald-700 space-y-2">
              <div className="flex items-center gap-2 font-black text-emerald-800"><ArrowDownUp className="h-4 w-4" /> Ringkasan Swap</div>
              <div className="flex justify-between"><span>Ambil</span><span className="font-black">{selectedSlot.batteryId}</span></div>
              <div className="flex justify-between"><span>Masukkan</span><span className="font-black">{emptyBatteryId || '-'}</span></div>
              <div className="flex justify-between border-t border-emerald-100 pt-2"><span>Biaya QRIS</span><span className="font-black">{formatRupiah(10000)}</span></div>
            </div>
          )}

          <button type="submit" disabled={isSubmitting || !selectedStationId || !selectedSlotId || !emptyBatteryId} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-500/15 disabled:opacity-50 transition flex items-center justify-center gap-2 active:scale-[0.99]">
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <QrCode className="h-5 w-5" />}
            Buat Barcode/QRIS Pembayaran
          </button>
        </form>
      )}
    </div>
  );
};

export default SwapQR;
