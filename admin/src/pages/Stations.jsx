import React, { useState, useEffect, useRef } from 'react';
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
  Cable,
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

const Stations = () => {
  const stationMapContainerRef = useRef(null);
  const stationMapRef = useRef(null);
  const stationMarkerRef = useRef(null);

  const [stations, setStations] = useState([]);
  const [cables, setCables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState(null);
  const [pageError, setPageError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [form, setForm] = useState(initialStationForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [showStationLocationPicker, setShowStationLocationPicker] = useState(false);

  const fetchStations = async () => {
    try {
      setLoading(true);
      setPageError('');
      const [stationRes, cableRes] = await Promise.all([
        api.get('/stations'),
        api.get('/batteries')
      ]);
      const list = stationRes.data.data || [];
      const cableList = cableRes.data.data || [];
      setStations(list);
      setCables(cableList);

      if (selectedStation) {
        const updated = list.find((station) => station.id === selectedStation.id);
        setSelectedStation(updated || null);
      }
    } catch (error) {
      console.error('Gagal mengambil data stasiun:', error);
      setPageError(error.response?.data?.message || 'Gagal mengambil data stasiun.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStationCoordinatesFromQrMap = (station) => {
    if (!station) {
      return { latitude: null, longitude: null, source: 'Data Stasiun', count: 0 };
    }

    const linkedCablePoints = cables
      .filter((cable) => cable.currentStationId === station.id)
      .map((cable) => ({
        latitude: Number(cable.latitude),
        longitude: Number(cable.longitude)
      }))
      .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));

    if (linkedCablePoints.length > 0) {
      const latitude = linkedCablePoints.reduce((sum, point) => sum + point.latitude, 0) / linkedCablePoints.length;
      const longitude = linkedCablePoints.reduce((sum, point) => sum + point.longitude, 0) / linkedCablePoints.length;
      return {
        latitude: Number(latitude.toFixed(8)),
        longitude: Number(longitude.toFixed(8)),
        source: 'Peta QR Charger',
        count: linkedCablePoints.length
      };
    }

    const fallbackLatitude = Number(station.latitude);
    const fallbackLongitude = Number(station.longitude);
    return {
      latitude: Number.isFinite(fallbackLatitude) ? fallbackLatitude : null,
      longitude: Number.isFinite(fallbackLongitude) ? fallbackLongitude : null,
      source: 'Data Stasiun',
      count: 0
    };
  };

  const syncFormCoordinatesFromQrMap = () => {
    const station = stations.find((item) => item.id === form.id) || selectedStation;
    const coordinates = getStationCoordinatesFromQrMap(station);

    if (coordinates.source !== 'Peta QR Charger') {
      setFormError('Belum ada titik kabel pada Peta QR Charger untuk stasiun ini. Tambahkan/pick titik kabel dulu di menu Peta QR Charger.');
      return;
    }

    setForm((current) => ({
      ...current,
      latitude: String(coordinates.latitude),
      longitude: String(coordinates.longitude)
    }));
    setFormError('');
  };

  const openAddModal = () => {
    setForm({
      ...initialStationForm,
      id: `ST-${String(stations.length + 1).padStart(3, '0')}`,
      latitude: '-6.',
      longitude: '106.'
    });
    setFormMode('create');
    setFormError('');
    setShowStationLocationPicker(false);
    setShowModal(true);
  };

  const openEditModal = (station) => {
    const qrMapCoordinates = getStationCoordinatesFromQrMap(station);
    setForm({
      id: station.id,
      name: station.name || '',
      address: station.address || '',
      latitude: qrMapCoordinates.latitude !== null && qrMapCoordinates.latitude !== undefined ? String(qrMapCoordinates.latitude) : '',
      longitude: qrMapCoordinates.longitude !== null && qrMapCoordinates.longitude !== undefined ? String(qrMapCoordinates.longitude) : '',
      slotCount: String(station.slots?.length || 4),
      status: station.status || 'active'
    });
    setFormMode('edit');
    setFormError('');
    setShowStationLocationPicker(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowStationLocationPicker(false);
    setShowModal(false);
  };

  const getStationFormLatLng = () => {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
    return JAKARTA_CENTER;
  };

  const setPickedStationLocation = (lat, lng) => {
    setForm((current) => ({
      ...current,
      latitude: lat.toFixed(8),
      longitude: lng.toFixed(8)
    }));
  };

  useEffect(() => {
    if (!showModal || !showStationLocationPicker || !stationMapContainerRef.current) return undefined;

    // Recreate the picker map every time the picker panel is opened to avoid
    // Leaflet "container already initialized" issues inside the modal.
    if (stationMapRef.current) {
      stationMapRef.current.remove();
      stationMapRef.current = null;
      stationMarkerRef.current = null;
    }

    const initialLatLng = getStationFormLatLng();
    const map = L.map(stationMapContainerRef.current, {
      zoomControl: true,
      attributionControl: true
    }).setView(initialLatLng, 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      crossOrigin: true,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker(initialLatLng, { draggable: true }).addTo(map);
    stationMapRef.current = map;
    stationMarkerRef.current = marker;

    const updateLocation = (latlng) => {
      marker.setLatLng(latlng);
      setPickedStationLocation(latlng.lat, latlng.lng);
    };

    map.on('click', (event) => updateLocation(event.latlng));
    marker.on('dragend', () => updateLocation(marker.getLatLng()));

    requestAnimationFrame(() => {
      map.invalidateSize(true);
      setTimeout(() => map.invalidateSize(true), 250);
    });

    return () => {
      map.remove();
      stationMapRef.current = null;
      stationMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, showStationLocationPicker]);

  const useCurrentPickerCenter = () => {
    const center = stationMapRef.current?.getCenter();
    if (!center) return;
    setPickedStationLocation(center.lat, center.lng);
    if (stationMarkerRef.current) stationMarkerRef.current.setLatLng(center);
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
      const stationForCoordinates = stations.find((station) => station.id === form.id);
      const qrMapCoordinates = getStationCoordinatesFromQrMap(stationForCoordinates);
      const payload = {
        name: form.name,
        address: form.address,
        latitude: qrMapCoordinates.source === 'Peta QR Charger' ? qrMapCoordinates.latitude : (form.latitude ? parseFloat(form.latitude) : null),
        longitude: qrMapCoordinates.source === 'Peta QR Charger' ? qrMapCoordinates.longitude : (form.longitude ? parseFloat(form.longitude) : null),
        status: form.status
      };

      const response = formMode === 'edit'
        ? await api.put(`/stations/${form.id}`, payload)
        : await api.post('/stations', {
            id: form.id,
            ...payload,
            slotCount: parseInt(form.slotCount, 10)
          });

      setSelectedStation(response.data.data);
      await fetchStations();
      closeModal();
    } catch (error) {
      console.error('Gagal menyimpan stasiun:', error);
      setFormError(error.response?.data?.message || error.message || 'Gagal menyimpan stasiun');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (station) => {
    const ok = window.confirm(`Hapus stasiun ${station.name}? Stasiun dengan riwayat transaksi tidak dapat dihapus dan sebaiknya diubah status menjadi inactive.`);
    if (!ok) return;

    setDeletingId(station.id);
    setPageError('');

    try {
      await api.delete(`/stations/${station.id}`);
      if (selectedStation?.id === station.id) setSelectedStation(null);
      await fetchStations();
    } catch (error) {
      console.error('Gagal menghapus stasiun:', error);
      setPageError(error.response?.data?.message || 'Gagal menghapus stasiun.');
    } finally {
      setDeletingId('');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">Aktif / Online</span>;
      case 'maintenance':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100">Maintenance</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-600 border border-slate-100">Inactive</span>;
    }
  };

  const getSlotStatusBadge = (status) => {
    switch (status) {
      case 'ready':
        return <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">Kabel Siap</span>;
      case 'charging':
        return <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md animate-pulse">Mengisi Daya</span>;
      case 'empty':
        return <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border px-2 py-0.5 rounded-md">Slot Kosong</span>;
      case 'faulty':
        return <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">Rusak</span>;
      case 'in-use':
        return <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">Dipakai</span>;
      case 'idle':
        return <span className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">Idle</span>;
      default:
        return <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Stasiun SPBKLU</h1>
          <p className="text-sm font-medium text-slate-500">Pantau lokasi fisik, edit status operasional, dan hapus stasiun yang sudah tidak dipakai.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchStations}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition shadow-sm active:scale-95"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition shadow-md shadow-emerald-500/15 active:scale-95"
          >
            <Plus className="h-5 w-5" /> Tambah Stasiun Baru
          </button>
        </div>
      </div>

      {pageError && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-600 flex items-start gap-3 text-sm font-bold">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>{pageError}</div>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="mt-4 text-sm text-slate-500 font-semibold">Memuat Data Stasiun SPBKLU...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">Daftar Lokasi Fisik ({stations.length})</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stations.map((station) => {
                const qrMapCoordinates = getStationCoordinatesFromQrMap(station);
                return (
                <div
                  key={station.id}
                  className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                    selectedStation?.id === station.id ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200'
                  }`}
                >
                  <button type="button" onClick={() => setSelectedStation(station)} className="text-left space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-black text-slate-400">ID: {station.id}</span>
                      {getStatusBadge(station.status)}
                    </div>
                    <h4 className="text-base font-black text-slate-800 tracking-tight">{station.name}</h4>
                    <p className="text-xs text-slate-500 font-semibold line-clamp-2">{station.address}</p>
                  </button>

                  <div className="border-t border-slate-100 mt-4 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="h-4 w-4" />
                        <span className="text-[10px] font-bold">{qrMapCoordinates.latitude ?? '-'}, {qrMapCoordinates.longitude ?? '-'}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        {station.slots ? station.slots.length : 0} Slot
                      </span>
                    </div>
                    <div className={`text-[10px] font-black px-2.5 py-1 rounded-lg inline-flex w-fit ${qrMapCoordinates.source === 'Peta QR Charger' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                      Koordinat: {qrMapCoordinates.source}{qrMapCoordinates.count ? ` (${qrMapCoordinates.count} titik kabel)` : ''}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => openEditModal(station)}
                        className="flex items-center justify-center gap-1.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition"
                      >
                        <Edit3 className="h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(station)}
                        disabled={deletingId === station.id}
                        className="flex items-center justify-center gap-1.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-bold text-xs rounded-xl transition disabled:opacity-50"
                      >
                        {deletingId === station.id ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-full min-h-[500px]">
            {selectedStation ? (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="space-y-1 pb-4 border-b border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnostik Stasiun</span>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">{selectedStation.name}</h3>
                    <p className="text-xs text-slate-500 font-semibold">{selectedStation.address}</p>
                    <div className="pt-2 flex items-center gap-1 text-slate-400">
                      <Activity className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-500">Status Modul: {selectedStation.status.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Status Slot / Kabel Charger Fisik</h4>
                    <div className="space-y-3">
                      {selectedStation.slots && selectedStation.slots.map((slot) => (
                        <div key={slot.slotId} className="flex items-center justify-between p-3.5 bg-slate-50 border rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-slate-200 font-black text-slate-600 text-sm flex items-center justify-center rounded-lg border border-slate-350">
                              S{slot.slotId}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800">
                                {slot.batteryId ? `Kabel ID: ${slot.batteryId}` : 'Slot Kosong'}
                              </div>
                              {slot.batteryId && <div className="text-[10px] font-semibold text-slate-400">Daya Pengisian: {slot.chargeLevel}%</div>}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            {getSlotStatusBadge(slot.status)}
                            {slot.batteryId && (
                              <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div className={`h-full ${slot.chargeLevel >= 90 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${slot.chargeLevel}%` }}></div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => openEditModal(selectedStation)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl transition"
                  >
                    <Edit3 className="h-4 w-4" /> Edit Status / Data Stasiun
                  </button>
                  <div className="bg-slate-50 border rounded-xl p-4 flex items-start gap-3">
                    <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                      Untuk stasiun yang memiliki riwayat transaksi, gunakan status <b>inactive</b> atau <b>maintenance</b>. Hapus hanya bisa dilakukan jika stasiun belum memiliki riwayat legacy.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-4">
                <MapPin className="h-12 w-12 text-slate-300 animate-bounce" />
                <div>
                  <h4 className="font-extrabold text-slate-700 text-sm">Pilih Stasiun SPBKLU</h4>
                  <p className="text-xs font-semibold text-slate-400 max-w-xs mt-1">Klik salah satu stasiun untuk melihat slot/kabel charger dan mengubah status operasionalnya.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden transform transition-all animate-scaleUp">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-500" />
                {formMode === 'edit' ? 'Edit Stasiun' : 'Registrasi Stasiun Baru'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-600 flex items-start gap-3 text-xs font-bold">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" />
                  <div>{formError}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">ID Stasiun</label>
                  <input
                    type="text"
                    required
                    disabled={formMode === 'edit'}
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    placeholder="e.g. ST-004"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-extrabold text-sm disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm"
                  >
                    <option value="active">Active / Online</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Stasiun</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. SPBKLU Senayan Sport"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-semibold text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Alamat Lengkap</label>
                <textarea
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Masukkan jalan, kecamatan, kota..."
                  rows="3"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-semibold text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Latitude</label>
                  <input value={form.latitude} readOnly title="Latitude otomatis dari Peta QR Charger" className="w-full px-4 py-2 bg-slate-100 border border-slate-250 rounded-xl text-slate-500 font-semibold text-sm cursor-not-allowed" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Longitude</label>
                  <input value={form.longitude} readOnly title="Longitude otomatis dari Peta QR Charger" className="w-full px-4 py-2 bg-slate-100 border border-slate-250 rounded-xl text-slate-500 font-semibold text-sm cursor-not-allowed" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah Slot</label>
                  <select
                    disabled={formMode === 'edit'}
                    value={form.slotCount}
                    onChange={(e) => setForm({ ...form, slotCount: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm disabled:opacity-60"
                  >
                    <option value="2">2 Slot</option>
                    <option value="4">4 Slot</option>
                    <option value="6">6 Slot</option>
                    <option value="8">8 Slot</option>
                  </select>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-2 text-xs font-semibold text-emerald-700">
                    <Crosshair className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Koordinat stasiun menggunakan data titik kabel yang terhubung di <b>Peta QR Charger</b>. Jika ada beberapa kabel pada stasiun yang sama, sistem memakai titik tengah/rata-rata koordinat kabel.</span>
                  </div>
                  <button
                    type="button"
                    onClick={syncFormCoordinatesFromQrMap}
                    className="px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-black text-emerald-700 hover:bg-emerald-100"
                  >
                    Sinkron dari Peta QR Charger
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 font-bold text-sm text-slate-600 rounded-xl transition">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-bold text-sm text-white rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition flex items-center justify-center gap-1.5">
                  {isSubmitting ? <Loader className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 stroke-[3]" /> {formMode === 'edit' ? 'Update Stasiun' : 'Simpan Stasiun'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stations;
