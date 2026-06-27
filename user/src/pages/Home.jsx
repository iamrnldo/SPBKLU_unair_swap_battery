import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import { MapPin, Battery, RefreshCw, Zap, Navigation } from 'lucide-react';

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const hasValidCoordinate = (station) => {
  const lat = toNumber(station.latitude);
  const lng = toNumber(station.longitude);
  if (lat === null || lng === null) return false;
  // 0,0 biasanya berarti koordinat belum diisi, bukan lokasi stasiun sebenarnya.
  if (Math.abs(lat) < 0.000001 && Math.abs(lng) < 0.000001) return false;
  return true;
};

const getStationLatLng = (station) => {
  if (!hasValidCoordinate(station)) return null;
  return {
    lat: toNumber(station.latitude),
    lng: toNumber(station.longitude)
  };
};

const getDistanceKm = (from, to) => {
  if (!from || !to) return null;

  const earthRadiusKm = 6371;
  const degToRad = (deg) => deg * (Math.PI / 180);
  const dLat = degToRad(to.lat - from.lat);
  const dLng = degToRad(to.lng - from.lng);
  const lat1 = degToRad(from.lat);
  const lat2 = degToRad(to.lat);

  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const formatDistance = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined) return null;
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(1)} km`;
};

const getDeviceLocation = () => new Promise((resolve) => {
  if (!navigator.geolocation) {
    resolve(null);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    },
    () => resolve(null),
    {
      enableHighAccuracy: true,
      timeout: 9000,
      maximumAge: 120000
    }
  );
});

const Home = () => {
  const { user, refreshProfile } = useAuth();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [activeBattery, setActiveBattery] = useState(null);

  const fetchHomeData = async () => {
    try {
      setLocationLoading(true);

      const [stationsRes, deviceLocation] = await Promise.all([
        api.get('/stations'),
        getDeviceLocation()
      ]);

      const stationList = stationsRes.data.data || [];
      setStations(stationList);
      setUserLocation(deviceLocation);

      await refreshProfile();

      const batteryRes = await api.get('/users/my-battery');
      setActiveBattery(batteryRes.data.data || null);
    } catch (error) {
      console.error('Failed to load home dashboard data:', error);
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
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const stationList = useMemo(() => {
    const mapped = stations.map((station) => {
      const stationLatLng = getStationLatLng(station);
      const distanceKm = userLocation && stationLatLng ? getDistanceKm(userLocation, stationLatLng) : null;
      return { ...station, stationLatLng, distanceKm };
    });

    return mapped.sort((a, b) => {
      // Prioritaskan stasiun aktif.
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;

      // Jika lokasi perangkat tersedia, urutkan berdasarkan jarak.
      if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
      if (a.distanceKm !== null) return -1;
      if (b.distanceKm !== null) return 1;

      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }, [stations, userLocation]);

  const getAvailableFullCount = (slots) => {
    if (!slots) return 0;
    return slots.filter((s) => s.status === 'ready' && s.chargeLevel >= 80).length;
  };

  const getStationDestination = (station) => {
    const latLng = getStationLatLng(station);
    if (latLng) return `${latLng.lat},${latLng.lng}`;
    return station.address || station.name || '';
  };

  const openGoogleMapsRoute = (station) => {
    const destination = getStationDestination(station);
    if (!destination) {
      alert('Koordinat atau alamat stasiun belum tersedia.');
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = url;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-10">
      <Header />

      <main className="px-5 py-6 space-y-6">
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
                    ⚠️ Daya baterai lemah! Segera tukarkan di stasiun terdekat.
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
                  Anda belum membawa baterai aktif SPBKLU. Pilih stasiun terdekat untuk memesan swap baterai.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Stasiun Terdekat ({stationList.length})</h3>
              <p className="text-[10px] font-semibold text-slate-400">
                {userLocation ? 'Diurutkan berdasarkan jarak dari lokasi Anda.' : 'Aktifkan izin lokasi agar urutan stasiun lebih akurat.'}
              </p>
            </div>
            {locationLoading && (
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                Mencari GPS...
              </span>
            )}
          </div>

          {loading ? (
            <div className="h-40 flex flex-col items-center justify-center bg-white border rounded-2xl shadow-sm">
              <div className="h-6 w-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="mt-3 text-xs text-slate-400 font-bold">Mencari Stasiun Terdekat...</span>
            </div>
          ) : stationList.length > 0 ? (
            <div className="space-y-4">
              {stationList.map((station) => {
                const fullCount = getAvailableFullCount(station.slots);
                const distanceLabel = formatDistance(station.distanceKm);
                const coordinateLabel = station.stationLatLng
                  ? `${station.stationLatLng.lat.toFixed(5)}, ${station.stationLatLng.lng.toFixed(5)}`
                  : 'Koordinat belum tersedia';

                return (
                  <div key={station.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4 hover:border-emerald-200 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-slate-400">
                          <MapPin className="h-3.5 w-3.5 text-rose-500 fill-current shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-wide truncate">ID: {station.id}</span>
                        </div>
                        <h4 className="text-sm font-black text-slate-800 tracking-tight">{station.name}</h4>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-2">{station.address}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{coordinateLabel}</p>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          station.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-orange-50 text-orange-600 border border-orange-100'
                        }`}>
                          {station.status === 'active' ? 'Online' : 'Offline'}
                        </span>
                        {distanceLabel && (
                          <span className="block text-[10px] font-black text-slate-700 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                            {distanceLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                        <span className="text-[9px] font-black text-emerald-600 uppercase block">Baterai Siap</span>
                        <div className="flex items-end gap-1 mt-0.5">
                          <span className="text-xl font-black text-emerald-700">{fullCount}</span>
                          <span className="text-[10px] text-emerald-600 font-bold pb-0.5">unit</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Total Slot</span>
                        <div className="flex items-end gap-1 mt-0.5">
                          <span className="text-xl font-black text-slate-800">{station.slots?.length || 0}</span>
                          <span className="text-[10px] text-slate-500 font-bold pb-0.5">slot</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => openGoogleMapsRoute(station)}
                      className="w-full flex items-center justify-center gap-2 text-xs font-black text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-3 rounded-xl shadow-lg shadow-emerald-500/10 active:scale-[0.99] transition"
                    >
                      <Navigation className="h-4 w-4" />
                      Rute Google Maps
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border rounded-2xl p-6 text-center text-slate-400 shadow-sm">
              <MapPin className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <h4 className="text-sm font-black text-slate-700">Belum Ada Stasiun</h4>
              <p className="text-xs font-semibold mt-1">Data stasiun SPBKLU belum tersedia.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Home;
