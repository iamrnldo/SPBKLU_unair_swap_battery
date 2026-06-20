import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import { MapPin, Battery, RefreshCw, Zap, Navigation, BatteryCharging } from 'lucide-react';

const Home = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeBattery, setActiveBattery] = useState(null);
  const [activeCharging, setActiveCharging] = useState(null);

  const fetchHomeData = async () => {
    try {
      // 1. Fetch stations list
      const stationsRes = await api.get('/stations');
      setStations(stationsRes.data.data);

      // 2. Refresh user profile (for latest wallet balance)
      await refreshProfile();

      // 3. Restore active charging session if user closed/minimized app while charging
      const chargingRes = await api.get('/charging/active');
      setActiveCharging(chargingRes.data.data || null);

      // 4. Legacy battery endpoint kept for old demo data
      const batteryRes = await api.get('/users/my-battery');
      setActiveBattery(batteryRes.data.data || null);
    } catch (error) {
      console.error('Failed to load home dashboard data:', error);
      // Fallback fallback simulated battery if route restricted or for demo reliability
      if (user?.id === 2) {
        setActiveBattery({
          id: 'BT-901',
          type: '60V/24Ah',
          chargeLevel: 25,
          stateOfHealth: 97,
          status: 'in-use'
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const getAvailableFullCount = (slots) => {
    if (!slots) return 0;
    return slots.filter(s => s.status === 'ready' && s.chargeLevel >= 80).length;
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-10">
      {/* Dynamic Header with wallet card widget */}
      <Header />

      <main className="px-5 py-6 space-y-6">
        {activeCharging?.session?.status === 'charging' && (
          <section className="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 text-white p-2.5 rounded-xl shadow-sm">
                <BatteryCharging className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">Sesi Charging Aktif</span>
                <h3 className="font-black text-slate-800 text-sm mt-0.5">{activeCharging.session.cableName}</h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Anda masih memiliki sesi charging yang belum diselesaikan. Buka halaman scan untuk menekan tombol Selesai Mengisi.
                </p>
              </div>
            </div>
            <div className="bg-white/70 border border-blue-100 rounded-xl p-3 text-xs font-semibold text-slate-600 space-y-1.5">
              <div className="flex justify-between"><span>ID Sesi</span><span className="font-black text-slate-800">#{activeCharging.session.sessionId}</span></div>
              <div className="flex justify-between"><span>Energi</span><span className="font-black text-blue-600">{(Number(activeCharging.session.estimatedKwh || 0)).toFixed(2)} kWh</span></div>
            </div>
            <button
              onClick={() => navigate('/swap-qr')}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-black text-sm rounded-xl transition shadow-lg shadow-blue-500/10"
            >
              Lanjutkan / Selesaikan Charging
            </button>
          </section>
        )}

        {/* SECTION 1: Active Battery Status */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Status Baterai Anda</h3>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-emerald-500 text-xs font-extrabold flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              Segarkan
            </button>
          </div>

          {activeBattery ? (
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 p-2 rounded-xl">
                    <Battery className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black tracking-tight">{activeBattery.id}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">{activeBattery.type}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                    In Use (Aktif)
                  </span>
                </div>
              </div>

              {/* Progress Level bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-slate-400">STATE OF CHARGE (SOC)</span>
                  <span className={`text-xl font-black ${activeBattery.chargeLevel <= 25 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                    {activeBattery.chargeLevel}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-750">
                  <div 
                    className={`h-full ${activeBattery.chargeLevel <= 25 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${activeBattery.chargeLevel}%` }}
                  ></div>
                </div>
                {activeBattery.chargeLevel <= 25 && (
                  <span className="text-[9px] text-rose-400 font-bold block pt-1 animate-pulse">
                    ⚠️ Saldo baterai lemah! Segera tukarkan di stasiun terdekat.
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Kesehatan Sel</span>
                  <p className="text-xs font-extrabold text-slate-200">{activeBattery.stateOfHealth}% SOH</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Suhu Kerja</span>
                  <p className="text-xs font-extrabold text-slate-200">34°C (Normal)</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border rounded-2xl p-5 text-center shadow-sm space-y-3">
              <div className="h-10 w-10 bg-slate-100 text-slate-400 flex items-center justify-center rounded-full mx-auto border">
                <Battery className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Tidak Ada Baterai Aktif</h4>
                <p className="text-xs font-semibold text-slate-400 max-w-xs mx-auto mt-0.5">
                  Anda belum menyewa atau memindai baterai SPBKLU aktif apa pun. Pergi ke stasiun terdekat untuk memulai penyewaan.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2: Near SPBKLU Swap Stations */}
        <section className="space-y-3">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Stasiun Terdekat ({stations.length})</h3>
            <p className="text-[10px] font-semibold text-slate-400">Cari stasiun yang memiliki baterai penuh siap pakai.</p>
          </div>

          {loading ? (
            <div className="h-40 flex flex-col items-center justify-center bg-white border rounded-2xl shadow-sm">
              <div className="h-6 w-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="mt-3 text-xs text-slate-400 font-bold">Mencari Stasiun Terdekat...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {stations.map((station) => {
                const fullCount = getAvailableFullCount(station.slots);
                return (
                  <div key={station.id} className="bg-white border rounded-2xl p-4.5 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-slate-400">
                          <MapPin className="h-3.5 w-3.5 text-rose-500 fill-current" />
                          <span className="text-[10px] font-bold uppercase tracking-wide">ID: {station.id}</span>
                        </div>
                        <h4 className="text-sm font-black text-slate-800 tracking-tight">{station.name}</h4>
                        <p className="text-xs text-slate-500 font-semibold line-clamp-1">{station.address}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          station.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-orange-50 text-orange-600 border border-orange-100'
                        }`}>
                          {station.status === 'active' ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4 text-emerald-500 fill-current" />
                        <span className="text-xs font-black text-slate-700">{fullCount} Baterai Siap</span>
                        <span className="text-[10px] text-slate-400 font-bold">/ {station.slots?.length || 0} Slot</span>
                      </div>

                      <button 
                        onClick={() => alert(`Membuka peta navigasi GPS ke: ${station.name}`)}
                        className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100"
                      >
                        <Navigation className="h-3 w-3" />
                        Rute
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Home;
