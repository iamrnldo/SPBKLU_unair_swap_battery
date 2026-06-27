import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import api from '../services/api';
import {
  MapPin,
  Plus,
  X,
  Check,
  Loader,
  Activity,
  AlertTriangle,
  Info,
  Edit3,
  Trash2,
  RefreshCw,
  Crosshair,
  Navigation
} from 'lucide-react';

const JAKARTA_CENTER = [-6.2, 106.816666];

const initialStationForm = {
  id: '',
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  slotCount: '4',
  status: 'active'
};

const toNumber = (value, fallback = null) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCoord = (value) => {
  const parsed = toNumber(value);
  return parsed === null ? '-' : parsed.toFixed(6);
};

const statusColor = (status) => {
  switch (status) {
    case 'active': return '#10b981';
    case 'maintenance': return '#f59e0b';
    case 'inactive': return '#64748b';
    default: return '#64748b';
  }
};

const createStationIcon = (station, active = false) => L.divIcon({
  className: 'spbklu-station-marker',
  html: `
    <div style="position:relative; width:${active ? 54 : 46}px; height:${active ? 54 : 46}px;">
      <div style="position:absolute; inset:0; border-radius:999px; background:${statusColor(station.status)}33; animation:pulse 1.6s infinite;"></div>
      <div style="position:absolute; inset:${active ? 3 : 5}px; border-radius:999px; background:${statusColor(station.status)}; border:4px solid white; box-shadow:0 14px 32px rgba(15,23,42,.28); display:flex; align-items:center; justify-content:center; color:white; font-weight:900; font-size:${active ? 18 : 15}px;">
        ⚡
      </div>
    </div>
  `,
  iconSize: [active ? 54 : 46, active ? 54 : 46],
  iconAnchor: [active ? 27 : 23, active ? 27 : 23],
  popupAnchor: [0, -24]
});

const Stations = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);

  const [stations, setStations] = useState([]);
  const [batteries, setBatteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState(null);
  const [pageError, setPageError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [form, setForm] = useState(initialStationForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [isPickingLocation, setIsPickingLocation] = useState(false);

  const stationPoints = useMemo(() => {
    return stations.map((station, index) => {
      const lat = toNumber(station.latitude, JAKARTA_CENTER[0] + index * 0.004);
      const lng = toNumber(station.longitude, JAKARTA_CENTER[1] + index * 0.004);
      return { ...station, latitude: lat, longitude: lng };
    });
  }, [stations]);

  const getStationBatteryStats = (stationId) => {
    const stationBatteries = batteries.filter((battery) => battery.currentStationId === stationId);
    const byType = stationBatteries.reduce((acc, battery) => {
      acc[battery.type] = (acc[battery.type] || 0) + 1;
      return acc;
    }, {});
    const byStatus = stationBatteries.reduce((acc, battery) => {
      acc[battery.status] = (acc[battery.status] || 0) + 1;
      return acc;
    }, {});
    return { total: stationBatteries.length, byType, byStatus };
  };

  const fetchStations = async () => {
    try {
      setLoading(true);
      setPageError('');
      const [stationRes, batteryRes] = await Promise.all([
        api.get('/stations'),
        api.get('/batteries')
      ]);
      const list = stationRes.data.data || [];
      setStations(list);
      setBatteries(batteryRes.data.data || []);
      if (selectedStation) {
        const updated = list.find((station) => station.id === selectedStation.id);
        setSelectedStation(updated || null);
      }
    } catch (error) {
      setPageError(error.response?.data?.message || 'Gagal mengambil data stasiun.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading || !mapContainerRef.current || mapRef.current) return undefined;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true
    }).setView(JAKARTA_CENTER, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      crossOrigin: true,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    requestAnimationFrame(() => {
      map.invalidateSize(true);
      setTimeout(() => map.invalidateSize(true), 250);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, [loading]);

  useEffect(() => {
    if (!mapRef.current) return undefined;

    const map = mapRef.current;
    const container = map.getContainer();

    if (!isPickingLocation) {
      container.style.cursor = '';
      return undefined;
    }

    container.style.cursor = 'crosshair';
    map.invalidateSize(true);

    const handlePick = (event) => {
      const { lat, lng } = event.latlng;
      setForm((current) => ({
        ...current,
        latitude: lat.toFixed(8),
        longitude: lng.toFixed(8)
      }));
      setIsPickingLocation(false);
      setShowModal(true);
      setPageError('');
    };

    map.on('click', handlePick);
    return () => {
      map.off('click', handlePick);
      container.style.cursor = '';
    };
  }, [isPickingLocation]);

  useEffect(() => {
    if (!mapRef.current || !markerLayerRef.current) return;

    mapRef.current.invalidateSize(true);
    markerLayerRef.current.clearLayers();
    const bounds = [];

    stationPoints.forEach((station) => {
      if (station.latitude === null || station.longitude === null) return;
      const isActive = selectedStation?.id === station.id;
      const stats = getStationBatteryStats(station.id);
      const typeSummary = Object.entries(stats.byType).map(([type, total]) => `${type}: ${total}`).join(', ') || '-';
      const marker = L.marker([station.latitude, station.longitude], {
        icon: createStationIcon(station, isActive),
        title: station.name || station.id
      });

      marker.bindPopup(`
        <div style="min-width:200px">
          <strong>${station.name || station.id}</strong><br />
          <span>ID: ${station.id}</span><br />
          <span>Status: ${station.status}</span><br />
          <span>Slot: ${station.slots?.length || 0}</span><br />
          <span>Battery: ${stats.total}</span><br />
          <span>Tipe: ${typeSummary}</span>
        </div>
      `);
      marker.on('click', () => setSelectedStation(station));
      marker.addTo(markerLayerRef.current);
      bounds.push([station.latitude, station.longitude]);
    });

    if (bounds.length > 0) {
      mapRef.current.fitBounds(L.latLngBounds(bounds).pad(0.22), { maxZoom: 15 });
    } else {
      mapRef.current.setView(JAKARTA_CENTER, 12);
    }
  }, [stationPoints, selectedStation?.id, batteries]);

  const getDefaultStationForm = () => {
    const center = mapRef.current?.getCenter();
    return {
      ...initialStationForm,
      id: `ST-${String(stations.length + 1).padStart(3, '0')}`,
      latitude: center?.lat?.toFixed(8) || String(JAKARTA_CENTER[0]),
      longitude: center?.lng?.toFixed(8) || String(JAKARTA_CENTER[1])
    };
  };

  const startPickLocation = ({ mode = formMode, nextForm = form } = {}) => {
    setFormMode(mode);
    setForm(nextForm);
    setFormError('');
    setShowModal(false);
    setIsPickingLocation(true);
    setPageError('Mode pick lokasi aktif. Klik titik pada peta Leaflet untuk menentukan lokasi stasiun SPBKLU.');
  };

  const openAddModal = () => {
    startPickLocation({ mode: 'create', nextForm: getDefaultStationForm() });
  };

  const openEditModal = (station) => {
    setForm({
      id: station.id,
      name: station.name || '',
      address: station.address || '',
      latitude: station.latitude !== null && station.latitude !== undefined ? String(station.latitude) : '',
      longitude: station.longitude !== null && station.longitude !== undefined ? String(station.longitude) : '',
      slotCount: String(station.slots?.length || 4),
      status: station.status || 'active'
    });
    setFormMode('edit');
    setFormError('');
    setShowModal(true);
  };

  const pickLocationForSelectedStation = () => {
    if (!selectedStation) return;
    const nextForm = {
      id: selectedStation.id,
      name: selectedStation.name || '',
      address: selectedStation.address || '',
      latitude: selectedStation.latitude !== null && selectedStation.latitude !== undefined ? String(selectedStation.latitude) : '',
      longitude: selectedStation.longitude !== null && selectedStation.longitude !== undefined ? String(selectedStation.longitude) : '',
      slotCount: String(selectedStation.slots?.length || 4),
      status: selectedStation.status || 'active'
    };
    startPickLocation({ mode: 'edit', nextForm });
  };

  const useMapCenter = () => {
    const center = mapRef.current?.getCenter();
    if (!center) return;
    setForm((current) => ({ ...current, latitude: center.lat.toFixed(8), longitude: center.lng.toFixed(8) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!form.id || !form.name || !form.address) {
      setFormError('ID Stasiun, Nama, dan Alamat wajib diisi');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: form.name,
        address: form.address,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        status: form.status
      };

      const response = formMode === 'edit'
        ? await api.put(`/stations/${form.id}`, payload)
        : await api.post('/stations', { id: form.id, ...payload, slotCount: parseInt(form.slotCount, 10) });

      setSelectedStation(response.data.data);
      await fetchStations();
      setShowModal(false);
    } catch (error) {
      setFormError(error.response?.data?.message || error.message || 'Gagal menyimpan stasiun');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (station) => {
    const ok = window.confirm(`Hapus stasiun ${station.name}? Jika sudah memiliki riwayat transaksi, ubah status menjadi inactive.`);
    if (!ok) return;

    setDeletingId(station.id);
    setPageError('');
    try {
      await api.delete(`/stations/${station.id}`);
      if (selectedStation?.id === station.id) setSelectedStation(null);
      await fetchStations();
    } catch (error) {
      setPageError(error.response?.data?.message || 'Gagal menghapus stasiun.');
    } finally {
      setDeletingId('');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">Aktif / Online</span>;
      case 'maintenance': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100">Maintenance</span>;
      default: return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-600 border border-slate-100">Inactive</span>;
    }
  };

  const getSlotStatusBadge = (status) => {
    switch (status) {
      case 'ready': return <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">Baterai Siap</span>;
      case 'reserved': return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">Dipesan</span>;
      case 'charging': return <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">Charging</span>;
      case 'empty': return <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border px-2 py-0.5 rounded-md">Kosong</span>;
      case 'faulty': return <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">Rusak</span>;
      default: return <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes pulse { 0%,100% { transform: scale(.75); opacity:.5; } 50% { transform: scale(1.35); opacity:.08; } }
        .leaflet-container { font-family: Inter, system-ui, sans-serif; }
        .leaflet-popup-content-wrapper { border-radius: 14px; }
      `}</style>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Stasiun SPBKLU</h1>
          <p className="text-sm font-medium text-slate-500">Kelola titik stasiun dengan peta Leaflet, status operasional, dan slot baterai swap.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchStations} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition shadow-sm active:scale-95">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition shadow-md shadow-emerald-500/15 active:scale-95">
            <Plus className="h-5 w-5" /> Pick Titik Stasiun Baru
          </button>
        </div>
      </div>

      {pageError && !isPickingLocation && <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-600 flex items-start gap-3 text-sm font-bold"><AlertTriangle className="h-5 w-5 shrink-0" />{pageError}</div>}
      {isPickingLocation && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-bold">
          <div className="flex items-start gap-3"><Crosshair className="h-5 w-5 shrink-0 mt-0.5" /><div><div>Klik lokasi pada peta untuk menentukan titik stasiun SPBKLU.</div><div className="text-xs font-semibold text-emerald-600 mt-0.5">Setelah klik, form {formMode === 'edit' ? 'edit' : 'tambah'} stasiun akan terbuka dengan koordinat otomatis.</div></div></div>
          <button onClick={() => { setIsPickingLocation(false); setPageError(''); }} className="px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-black text-emerald-700 hover:bg-emerald-100">Batal Pick</button>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center"><div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div><span className="mt-4 text-sm text-slate-500 font-semibold">Memuat Data Stasiun...</span></div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div><h3 className="text-sm font-black text-slate-800">Peta Titik Stasiun</h3><p className="text-xs font-semibold text-slate-400">Leaflet + OpenStreetMap untuk visualisasi lokasi SPBKLU.</p></div>
              <span className="text-xs font-bold text-slate-400 bg-slate-50 border px-3 py-1.5 rounded-lg">{stations.length} Stasiun</span>
            </div>
            <div ref={mapContainerRef} className="spbklu-leaflet-map h-[620px] w-full bg-slate-100" />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col min-h-[620px]">
            {selectedStation ? (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="space-y-1 pb-4 border-b border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Stasiun</span>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">{selectedStation.name}</h3>
                    <p className="text-xs text-slate-500 font-semibold">{selectedStation.address}</p>
                    <div className="pt-2 flex items-center gap-1 text-slate-400"><Activity className="h-4 w-4 text-emerald-500" /><span className="text-xs font-bold text-slate-500">Status Modul: {selectedStation.status.toUpperCase()}</span></div>
                    <div className="pt-1 flex items-center gap-1 text-slate-400"><MapPin className="h-4 w-4 text-rose-500" /><span className="text-xs font-bold text-slate-500">{formatCoord(selectedStation.latitude)}, {formatCoord(selectedStation.longitude)}</span></div>
                  </div>

                  {(() => {
                    const stats = getStationBatteryStats(selectedStation.id);
                    return (
                      <div className="grid grid-cols-1 gap-3 pt-5">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Jumlah Battery di Lokasi</span>
                          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.total}</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total per Tipe Battery</span>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {Object.entries(stats.byType).map(([type, total]) => (
                              <span key={type} className="px-2 py-1 bg-white border rounded-lg text-[10px] font-black text-slate-700">{type}: {total}</span>
                            ))}
                            {Object.keys(stats.byType).length === 0 && <span className="text-[10px] font-bold text-slate-400">Belum ada battery ditempatkan di lokasi ini</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="space-y-4 pt-6">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Status Slot Baterai</h4>
                    <div className="space-y-3">
                      {selectedStation.slots && selectedStation.slots.map((slot) => (
                        <div key={slot.slotId} className="flex items-center justify-between p-3.5 bg-slate-50 border rounded-xl">
                          <div className="flex items-center gap-3"><div className="h-9 w-9 bg-slate-200 font-black text-slate-600 text-sm flex items-center justify-center rounded-lg border border-slate-350">S{slot.slotId}</div><div><div className="text-xs font-bold text-slate-800">{slot.batteryId ? `Baterai ID: ${slot.batteryId}` : 'Slot Kosong'}</div>{slot.batteryId && <div className="text-[10px] font-semibold text-slate-400">SOC: {slot.chargeLevel || 0}%</div>}</div></div>
                          {getSlotStatusBadge(slot.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => openEditModal(selectedStation)} className="flex items-center justify-center gap-1.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition"><Edit3 className="h-4 w-4" /> Edit</button>
                  <button onClick={pickLocationForSelectedStation} className="flex items-center justify-center gap-1.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 font-bold text-xs rounded-xl transition"><Crosshair className="h-4 w-4" /> Pindah</button>
                  <button onClick={() => handleDelete(selectedStation)} disabled={deletingId === selectedStation.id} className="flex items-center justify-center gap-1.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-bold text-xs rounded-xl transition disabled:opacity-50">{deletingId === selectedStation.id ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Hapus</button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-4"><MapPin className="h-12 w-12 text-slate-300 animate-bounce" /><div><h4 className="font-extrabold text-slate-700 text-sm">Pilih Titik Stasiun</h4><p className="text-xs font-semibold text-slate-400 max-w-xs mt-1">Klik marker pada peta Leaflet untuk melihat detail stasiun.</p></div></div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden transform transition-all animate-scaleUp">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between"><h3 className="text-base font-black text-slate-800 flex items-center gap-2"><MapPin className="h-5 w-5 text-emerald-500" />{formMode === 'edit' ? 'Edit Stasiun' : 'Registrasi Stasiun Baru'}</h3><button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-600 flex items-start gap-3 text-xs font-bold"><AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" />{formError}</div>}
              <div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">ID Stasiun</label><input type="text" required disabled={formMode === 'edit'} value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-extrabold text-sm disabled:opacity-60" /></div><div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm"><option value="active">Active / Online</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive</option></select></div></div>
              <div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Stasiun</label><input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-semibold text-sm" /></div>
              <div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Alamat Lengkap</label><textarea required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows="3" className="w-full px-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-semibold text-sm" /></div>
              <div className="grid grid-cols-3 gap-4"><div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Latitude</label><input readOnly value={form.latitude} className="w-full px-4 py-2 bg-slate-100 border border-slate-250 rounded-xl text-slate-500 font-semibold text-sm cursor-not-allowed" /></div><div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Longitude</label><input readOnly value={form.longitude} className="w-full px-4 py-2 bg-slate-100 border border-slate-250 rounded-xl text-slate-500 font-semibold text-sm cursor-not-allowed" /></div><div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah Slot</label><select disabled={formMode === 'edit'} value={form.slotCount} onChange={(e) => setForm({ ...form, slotCount: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm disabled:opacity-60"><option value="2">2 Slot</option><option value="4">4 Slot</option><option value="6">6 Slot</option><option value="8">8 Slot</option></select></div></div>
              <div className="flex justify-end"><button type="button" onClick={() => startPickLocation({ mode: formMode, nextForm: form })} className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-100"><Crosshair className="h-4 w-4" /> Pick Lokasi di Peta</button><button type="button" onClick={useMapCenter} className="ml-2 inline-flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"><Navigation className="h-4 w-4" /> Pakai Tengah Peta</button></div>
              <div className="flex gap-3 pt-4 border-t border-slate-100"><button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 font-bold text-sm text-slate-600 rounded-xl transition">Batal</button><button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-bold text-sm text-white rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition flex items-center justify-center gap-1.5">{isSubmitting ? <Loader className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 stroke-[3]" /> {formMode === 'edit' ? 'Update Stasiun' : 'Simpan Stasiun'}</>}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stations;
