import React, { useEffect, useMemo, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatRupiah } from '../utils/formatter';
import {
  Scan,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Camera,
  CameraOff,
  Cable,
  Wallet,
  MapPin,
  RefreshCw,
  BatteryCharging,
  Check,
  XCircle,
  PlayCircle,
  StopCircle
} from 'lucide-react';

const parseIntSafe = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatKwh = (watt) => `${(parseIntSafe(watt) / 1000).toFixed(2)} kWh`;
const ACTIVE_CHARGING_STORAGE_KEY = 'spbklu_active_charging_session';

const SwapQR = () => {
  const { user, refreshProfile } = useAuth();
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const mountedRef = useRef(false);
  const scannerRunIdRef = useRef(0);
  const scannedOnceRef = useRef(false);

  const [scannerActive, setScannerActive] = useState(false);
  const [scannerStarting, setScannerStarting] = useState(false);
  const [scannedQrString, setScannedQrString] = useState('');

  const [cableInfo, setCableInfo] = useState(null);
  const [inputMode, setInputMode] = useState('amount');
  const [amount, setAmount] = useState('10000');
  const [requestedWatt, setRequestedWatt] = useState('4000');

  const [validating, setValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [restoringActive, setRestoringActive] = useState(true);
  const [successResult, setSuccessResult] = useState(null);
  const [completedResult, setCompletedResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const hardStopVideoTracks = () => {
    const video = videoRef.current;
    const stream = video?.srcObject;

    if (stream && typeof stream.getTracks === 'function') {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (error) {
          console.error('Failed to stop camera track:', error);
        }
      });
    }

    if (video) {
      try {
        video.pause();
        video.srcObject = null;
        video.removeAttribute('src');
        video.load?.();
      } catch (error) {
        console.error('Failed to cleanup video element:', error);
      }
    }
  };

  const stopScanner = async (updateState = true) => {
    // Invalidate pending scanner.start() promises to avoid white blank when
    // navigating away while the camera is still opening.
    scannerRunIdRef.current += 1;

    const scanner = scannerRef.current;
    scannerRef.current = null;

    if (scanner) {
      try {
        await Promise.resolve(scanner.stop());
      } catch (error) {
        console.error('Failed to stop QR scanner:', error);
      }

      try {
        scanner.destroy();
      } catch (error) {
        console.error('Failed to destroy QR scanner:', error);
      }
    }

    hardStopVideoTracks();

    if (updateState && mountedRef.current) {
      setScannerActive(false);
      setScannerStarting(false);
    }
  };

  const restoreActiveChargingSession = async () => {
    if (mountedRef.current) setRestoringActive(true);

    try {
      const response = await api.get('/charging/active');
      if (!mountedRef.current) return;

      const active = response.data.data;

      if (active?.session?.status === 'charging') {
        setSuccessResult(active);
        setCableInfo(null);
        setScannedQrString('');
        setCompletedResult(null);
        setErrorMsg('');
        setScannerActive(false);
        localStorage.setItem(ACTIVE_CHARGING_STORAGE_KEY, JSON.stringify(active.session));
      } else {
        localStorage.removeItem(ACTIVE_CHARGING_STORAGE_KEY);
        setScannerActive(true);
      }
    } catch (error) {
      if (!mountedRef.current) return;

      console.error('Failed to restore active charging session:', error);
      const cachedSession = localStorage.getItem(ACTIVE_CHARGING_STORAGE_KEY);
      if (cachedSession) {
        try {
          const session = JSON.parse(cachedSession);
          setSuccessResult({ session, restored: true, offlineRestored: true, remainingBalance: user?.balance || 0 });
          setScannerActive(false);
          setErrorMsg('Gagal mengecek server. Sesi charging terakhir ditampilkan dari cache lokal; hubungkan kembali ke backend untuk menyelesaikan charging.');
        } catch (_) {
          localStorage.removeItem(ACTIVE_CHARGING_STORAGE_KEY);
          setScannerActive(true);
        }
      } else {
        setScannerActive(true);
      }
    } finally {
      if (mountedRef.current) setRestoringActive(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    refreshProfile();
    restoreActiveChargingSession();

    return () => {
      mountedRef.current = false;
      stopScanner(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!scannerActive || restoringActive || !videoRef.current) return undefined;

    let cancelled = false;
    const runId = ++scannerRunIdRef.current;

    const start = async () => {
      if (mountedRef.current) {
        setScannerStarting(true);
        setErrorMsg('');
      }
      scannedOnceRef.current = false;

      let scanner = null;

      try {
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          throw new Error('Kamera tidak ditemukan di perangkat ini.');
        }

        if (cancelled || !mountedRef.current || runId !== scannerRunIdRef.current || !videoRef.current) return;

        scanner = new QrScanner(
          videoRef.current,
          (result) => {
            if (cancelled || !mountedRef.current) return;

            const qrText = typeof result === 'string' ? result : result?.data;
            if (!qrText || scannedOnceRef.current) return;
            scannedOnceRef.current = true;
            handleQrDetected(qrText);
          },
          {
            preferredCamera: 'environment',
            maxScansPerSecond: 6,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            returnDetailedScanResult: true
          }
        );

        scannerRef.current = scanner;
        await scanner.start();

        if (cancelled || !mountedRef.current || runId !== scannerRunIdRef.current) {
          try { await Promise.resolve(scanner.stop()); } catch (_) {}
          try { scanner.destroy(); } catch (_) {}
          hardStopVideoTracks();
        }
      } catch (error) {
        if (!cancelled && mountedRef.current && runId === scannerRunIdRef.current) {
          console.error('QR scanner failed:', error);
          setErrorMsg(error.message || 'Gagal membuka kamera. Pastikan izin kamera sudah diberikan.');
          setScannerActive(false);
        } else if (scanner) {
          try { await Promise.resolve(scanner.stop()); } catch (_) {}
          try { scanner.destroy(); } catch (_) {}
          hardStopVideoTracks();
        }
      } finally {
        if (!cancelled && mountedRef.current && runId === scannerRunIdRef.current) {
          setScannerStarting(false);
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      stopScanner(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerActive, restoringActive]);

  const resetFlow = async () => {
    await stopScanner();
    setScannedQrString('');
    setCableInfo(null);
    setInputMode('amount');
    setAmount('10000');
    setRequestedWatt('4000');
    setSuccessResult(null);
    setCompletedResult(null);
    setErrorMsg('');
    setScannerActive(true);
  };

  const validateQrString = async (qrString) => {
    setValidating(true);
    setErrorMsg('');
    setSuccessResult(null);
    setCompletedResult(null);

    try {
      const response = await api.post('/charging/scan', { qrString });
      if (!mountedRef.current) return;
      const data = response.data.data;
      setCableInfo(data);
      setScannedQrString(qrString);
      setAmount(String(Math.max(data.pricing?.minAmount || 1000, 10000)));
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('QR validation failed:', error);
      setErrorMsg(error.response?.data?.message || error.message || 'QR Code tidak valid.');
      scannedOnceRef.current = false;
    } finally {
      if (mountedRef.current) setValidating(false);
    }
  };

  const handleQrDetected = async (qrString) => {
    await stopScanner();
    await validateQrString(qrString);
  };

  const chargingPreview = useMemo(() => {
    const pricePerKwh = cableInfo?.cable?.pricePerKwh || cableInfo?.pricing?.pricePerKwh || 2500;

    if (inputMode === 'amount') {
      const parsedAmount = parseIntSafe(amount);
      const estimatedWatt = pricePerKwh > 0 ? Math.floor((parsedAmount / pricePerKwh) * 1000) : 0;
      return {
        amount: parsedAmount,
        watt: estimatedWatt,
        kwh: estimatedWatt / 1000
      };
    }

    const parsedWatt = parseIntSafe(requestedWatt);
    const estimatedAmount = Math.ceil((parsedWatt / 1000) * pricePerKwh);
    return {
      amount: estimatedAmount,
      watt: parsedWatt,
      kwh: parsedWatt / 1000
    };
  }, [amount, requestedWatt, inputMode, cableInfo]);

  const startCharging = async (e) => {
    e.preventDefault();
    if (!cableInfo || !scannedQrString) return;

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const payload = {
        qrString: scannedQrString,
        ...(inputMode === 'amount'
          ? { amount: parseIntSafe(amount) }
          : { requestedWatt: parseIntSafe(requestedWatt) })
      };

      const response = await api.post('/charging/start', payload);
      if (!mountedRef.current) return;
      setSuccessResult(response.data.data);
      if (response.data.data?.session) {
        localStorage.setItem(ACTIVE_CHARGING_STORAGE_KEY, JSON.stringify(response.data.data.session));
      }
      await refreshProfile();
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Start charging failed:', error);
      setErrorMsg(error.response?.data?.message || error.message || 'Gagal memulai charging.');
    } finally {
      if (mountedRef.current) setIsSubmitting(false);
    }
  };

  const completeCharging = async () => {
    if (!successResult?.session?.sessionId) return;
    setCompleting(true);
    setErrorMsg('');

    try {
      const response = await api.post(`/charging/${successResult.session.sessionId}/complete`);
      if (!mountedRef.current) return;
      setCompletedResult(response.data.data);
      localStorage.removeItem(ACTIVE_CHARGING_STORAGE_KEY);
      await refreshProfile();
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Complete charging failed:', error);
      setErrorMsg(error.response?.data?.message || error.message || 'Gagal menyelesaikan sesi charging.');
    } finally {
      if (mountedRef.current) setCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-5 pb-24 space-y-6">
      {/* Header */}
      <div className="text-center pt-4 space-y-1">
        <div className="inline-flex bg-emerald-50 text-emerald-500 border border-emerald-100 p-2.5 rounded-2xl mb-1">
          <Scan className="h-6 w-6 stroke-[3]" />
        </div>
        <h2 className="text-lg font-black text-slate-800 tracking-tight">Scan QR Charger</h2>
        <p className="text-xs font-semibold text-slate-400">Pindai QR Code pada unit SPBKLU, lalu pilih nominal atau watt pengisian kendaraan.</p>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-rose-600 flex items-start gap-2 text-xs font-bold leading-relaxed">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
          <div>{errorMsg}</div>
        </div>
      )}

      {restoringActive ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
          <h3 className="font-black text-slate-800 text-sm">Memulihkan Sesi Charging...</h3>
          <p className="text-xs font-semibold text-slate-400">Aplikasi sedang mengecek apakah ada charging aktif yang belum diselesaikan.</p>
        </div>
      ) : completedResult ? (
        <div className="bg-white border rounded-2xl p-6 text-center shadow-xl border-slate-200 animate-scaleUp space-y-5">
          <div className="bg-emerald-500 text-white p-3 rounded-full shadow-lg shadow-emerald-500/20 inline-flex">
            <Check className="h-10 w-10 stroke-[3]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800">Charging Selesai</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">Terima kasih telah menggunakan SPBKLU.</p>
          </div>
          <div className="bg-slate-50 p-4 border rounded-xl text-left text-xs font-semibold space-y-2 text-slate-600">
            <div className="flex justify-between border-b pb-2 border-slate-200/80">
              <span className="text-slate-400">ID SESI</span>
              <span className="font-extrabold text-slate-800">#{completedResult.session.sessionId}</span>
            </div>
            <div className="flex justify-between">
              <span>Kabel</span>
              <span className="font-extrabold text-slate-800">{completedResult.session.cableName}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Pengisian</span>
              <span className="font-extrabold text-emerald-600">{formatKwh(completedResult.session.requestedWatt)}</span>
            </div>
          </div>
          <button onClick={resetFlow} className="w-full py-3 bg-slate-900 text-white font-black text-sm rounded-xl shadow transition">
            Scan QR Lagi
          </button>
        </div>
      ) : successResult ? (
        <div className="bg-white border rounded-2xl p-6 text-center shadow-xl border-slate-200 animate-scaleUp space-y-5">
          <div className="bg-emerald-500 text-white p-3 rounded-full shadow-lg shadow-emerald-500/20 inline-flex">
            <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-800">Charging Dimulai!</h3>
            <p className="text-xs font-semibold text-emerald-600">Kabel charger aktif. Silakan mulai mengisi kendaraan.</p>
            {successResult.restored && (
              <p className="text-[10px] font-bold text-blue-500 mt-1">Sesi ini dipulihkan dari server setelah aplikasi ditutup/background.</p>
            )}
          </div>

          <div className="bg-slate-50 p-4 border rounded-xl text-left text-xs font-semibold space-y-2 text-slate-600">
            <div className="flex justify-between border-b pb-2 border-slate-200/80">
              <span className="text-slate-400">ID SESI</span>
              <span className="font-extrabold text-slate-800">#{successResult.session.sessionId}</span>
            </div>
            <div className="flex justify-between">
              <span>Kabel</span>
              <span className="font-extrabold text-slate-800">{successResult.session.cableName}</span>
            </div>
            <div className="flex justify-between">
              <span>Stasiun</span>
              <span className="font-extrabold text-slate-800 text-right">{successResult.session.stationName || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span>Target Energi</span>
              <span className="font-extrabold text-emerald-600">{formatKwh(successResult.session.requestedWatt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Biaya</span>
              <span className="font-extrabold text-slate-800">{formatRupiah(successResult.session.amount)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200/80 font-bold">
              <span>Sisa Saldo</span>
              <span className="font-black text-emerald-600 text-sm">{formatRupiah(successResult.remainingBalance)}</span>
            </div>
          </div>

          <button
            onClick={completeCharging}
            disabled={completing}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm rounded-xl shadow-lg disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {completing ? <Loader2 className="h-5 w-5 animate-spin" /> : <StopCircle className="h-5 w-5" />}
            Selesai Mengisi
          </button>
          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">Tombol ini mensimulasikan sinyal selesai dari perangkat IoT charger.</p>
        </div>
      ) : !cableInfo ? (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-800 text-sm">1. Scan QR pada unit SPBKLU</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Kamera terbuka otomatis. Arahkan ke QR Code yang sudah digenerate admin.</p>
              </div>
              <div className="bg-emerald-50 text-emerald-500 border border-emerald-100 p-2 rounded-xl">
                <Camera className="h-5 w-5" />
              </div>
            </div>

            {scannerActive && (
              <div className="relative rounded-2xl overflow-hidden border-4 border-slate-900 bg-slate-950 aspect-square shadow-xl">
                <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
                {scannerStarting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 text-white">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                    <span className="mt-3 text-xs font-bold">Membuka kamera...</span>
                  </div>
                )}
                <div className="absolute inset-x-8 top-1/2 h-0.5 bg-emerald-400 shadow-[0_0_18px_#34d399] animate-pulse" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {!scannerActive ? (
                <button
                  onClick={() => setScannerActive(true)}
                  disabled={validating}
                  className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  Buka Kamera
                </button>
              ) : (
                <button
                  onClick={stopScanner}
                  className="py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-2"
                >
                  <CameraOff className="h-4 w-4" />
                  Tutup Kamera
                </button>
              )}
              <button
                onClick={resetFlow}
                className="py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-black text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Scan Ulang
              </button>
            </div>
          </div>

        </div>
      ) : (
        <form onSubmit={startCharging} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-start gap-3">
              <div className="bg-emerald-50 text-emerald-500 border border-emerald-100 p-2.5 rounded-xl">
                <Cable className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">QR Valid</span>
                <h3 className="font-black text-slate-800 text-sm mt-0.5">{cableInfo.cable.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold">{cableInfo.cable.id} • {cableInfo.cable.type}</p>
              </div>
            </div>
            <button type="button" onClick={resetFlow} className="text-slate-400 hover:text-rose-500 transition">
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-600">
            <div className="bg-slate-50 border rounded-xl p-3">
              <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Lokasi</span>
              <div className="flex items-start gap-1.5">
                <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                <span className="font-extrabold text-slate-800">{cableInfo.cable.stationName || 'SPBKLU'}</span>
              </div>
            </div>
            <div className="bg-slate-50 border rounded-xl p-3">
              <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Tarif</span>
              <span className="font-extrabold text-slate-800">{formatRupiah(cableInfo.cable.pricePerKwh)}/kWh</span>
            </div>
            <div className="bg-slate-50 border rounded-xl p-3">
              <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Daya Maks</span>
              <span className="font-extrabold text-emerald-600">{cableInfo.cable.powerWatt} W</span>
            </div>
            <div className="bg-slate-50 border rounded-xl p-3">
              <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Saldo</span>
              <span className="font-extrabold text-slate-800">{formatRupiah(user?.balance || 0)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">2. Pilih metode input pengisian</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setInputMode('amount')}
                className={`py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 ${inputMode === 'amount' ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
              >
                <Wallet className="h-4 w-4" /> Nominal Rp
              </button>
              <button
                type="button"
                onClick={() => setInputMode('watt')}
                className={`py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 ${inputMode === 'watt' ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
              >
                <BatteryCharging className="h-4 w-4" /> Target Watt
              </button>
            </div>
          </div>

          {inputMode === 'amount' ? (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Nominal pembayaran</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-extrabold text-xs">Rp</span>
                <input
                  type="number"
                  min={cableInfo.pricing.minAmount}
                  step={cableInfo.pricing.amountStep}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-extrabold text-sm focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[10000, 20000, 50000].map((preset) => (
                  <button key={preset} type="button" onClick={() => setAmount(String(preset))} className="py-2 bg-slate-50 border rounded-xl text-[10px] font-black text-slate-600">
                    {formatRupiah(preset)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Target energi pengisian watt-hour (Wh)</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="100"
                  required
                  value={requestedWatt}
                  onChange={(e) => setRequestedWatt(e.target.value)}
                  className="w-full pr-12 px-4 py-3 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-extrabold text-sm focus:outline-none"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 font-extrabold text-xs">Wh</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[2000, 4000, 10000].map((preset) => (
                  <button key={preset} type="button" onClick={() => setRequestedWatt(String(preset))} className="py-2 bg-slate-50 border rounded-xl text-[10px] font-black text-slate-600">
                    {formatKwh(preset)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 text-xs font-semibold">
            <div className="flex justify-between">
              <span className="text-slate-400">Estimasi energi</span>
              <span className="font-black text-emerald-400">{formatKwh(chargingPreview.watt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimasi biaya</span>
              <span className="font-black text-white text-sm">{formatRupiah(chargingPreview.amount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2">
              <span className="text-slate-400">Sisa saldo setelah transaksi</span>
              <span className={`font-black ${(user?.balance || 0) >= chargingPreview.amount ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatRupiah((user?.balance || 0) - chargingPreview.amount)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !chargingPreview.amount || (user?.balance || 0) < chargingPreview.amount}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-500/15 disabled:opacity-50 transition flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Memulai Charging...</span>
              </>
            ) : (
              <>
                <PlayCircle className="h-5 w-5" />
                <span>Mulai Charging</span>
              </>
            )}
          </button>

          {(user?.balance || 0) < chargingPreview.amount && (
            <p className="text-[10px] text-rose-500 font-bold text-center">Saldo tidak mencukupi. Silakan top up saldo dari halaman Akun.</p>
          )}
        </form>
      )}
    </div>
  );
};

export default SwapQR;
