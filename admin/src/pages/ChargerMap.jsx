import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import {
  MapPin,
  Cable,
  QrCode,
  Plus,
  RefreshCw,
  Loader,
  AlertTriangle,
  X,
  Check,
  Copy,
  Download,
  RotateCcw,
  Zap,
  Navigation,
  Printer,
  Edit3,
  Trash2,
  Crosshair
} from 'lucide-react';

const JAKARTA_CENTER = [-6.2, 106.816666];

const toNumber = (value, fallback = null) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCoord = (value) => {
  const parsed = toNumber(value);
  return parsed === null ? '-' : parsed.toFixed(6);
};

const statusLabel = (status) => {
  switch (status) {
    case 'ready': return 'Siap Digunakan';
    case 'charging': return 'Sedang Mengisi';
    case 'in-use': return 'Dipakai User';
    case 'faulty': return 'Bermasalah';
    default: return 'Idle';
  }
};

const statusClasses = (status) => {
  switch (status) {
    case 'ready': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'charging': return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'in-use': return 'bg-purple-50 text-purple-600 border-purple-100';
    case 'faulty': return 'bg-rose-50 text-rose-600 border-rose-100';
    default: return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};

const pinColor = (status) => {
  switch (status) {
    case 'ready': return '#10b981';
    case 'charging': return '#3b82f6';
    case 'in-use': return '#8b5cf6';
    case 'faulty': return '#ef4444';
    default: return '#64748b';
  }
};

const createCableIcon = (point, active = false) => L.divIcon({
  className: 'spbklu-cable-marker',
  html: `
    <div style="position:relative; width:${active ? 52 : 46}px; height:${active ? 52 : 46}px; transform: translate(-50%, -50%);">
      <div style="position:absolute; inset:0; border-radius:999px; background:${pinColor(point.status)}33; animation:pulse 1.6s infinite;"></div>
      <div style="position:absolute; inset:${active ? 3 : 5}px; border-radius:999px; background:${pinColor(point.status)}; border:4px solid white; box-shadow:0 14px 32px rgba(15,23,42,.28); display:flex; align-items:center; justify-content:center; color:white; font-weight:900; font-size:${active ? 16 : 14}px;">
        ⚡
      </div>
    </div>
  `,
  iconSize: [active ? 52 : 46, active ? 52 : 46],
  iconAnchor: [active ? 26 : 23, active ? 26 : 23],
  popupAnchor: [0, -24]
});

const emptyCableForm = {
  id: '',
  name: '',
  type: 'Type 2 AC',
  powerWatt: '2200',
  pricePerKwh: '2500',
  currentStationId: '',
  slotId: '',
  latitude: '',
  longitude: '',
  locationNote: '',
  status: 'ready',
  stateOfHealth: '100'
};

const ChargerMap = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);

  const [stations, setStations] = useState([]);
  const [cables, setCables] = useState([]);
  const [selectedCable, setSelectedCable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showCableModal, setShowCableModal] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [form, setForm] = useState(emptyCableForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [qrModal, setQrModal] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [isPickingLocation, setIsPickingLocation] = useState(false);

  const stationById = useMemo(() => {
    const map = new Map();
    stations.forEach((station) => map.set(station.id, station));
    return map;
  }, [stations]);

  const mapPoints = useMemo(() => {
    return cables.map((cable, index) => {
      const station = stationById.get(cable.currentStationId);
      const latitude = toNumber(cable.latitude, toNumber(station?.latitude, JAKARTA_CENTER[0] + index * 0.002));
      const longitude = toNumber(cable.longitude, toNumber(station?.longitude, JAKARTA_CENTER[1] + index * 0.002));

      return {
        ...cable,
        latitude,
        longitude,
        stationName: station?.name || cable.currentStationId || 'Belum terikat stasiun'
      };
    });
  }, [cables, stationById]);

  const loadData = async () => {
    try {
      setErrorMsg('');
      const [stationRes, cableRes] = await Promise.all([
        api.get('/stations'),
        api.get('/batteries')
      ]);

      const stationList = stationRes.data.data || [];
      const cableList = cableRes.data.data || [];
      setStations(stationList);
      setCables(cableList);

      if (selectedCable) {
        const updated = cableList.find((cable) => cable.id === selectedCable.id);
        setSelectedCable(updated || null);
      }
    } catch (error) {
      console.error('Gagal memuat peta kabel:', error);
      setErrorMsg(error.response?.data?.message || 'Gagal memuat data peta kabel charger.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize Leaflet after loading is finished.
  // Important: while `loading === true` this component renders only the loading
  // screen, so the map div/ref does not exist yet. The effect must rerun after
  // loading becomes false; otherwise Leaflet is never initialized and the panel
  // stays blank/grey.
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

    // Leaflet sometimes initializes before the flex/grid panel has its final
    // dimensions in React/Vite dev mode. Force a size recalculation so tiles
    // and controls are drawn instead of a blank grey canvas.
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

  // Pick-location mode: admin clicks directly on the Leaflet map to set
  // latitude/longitude for a new or existing charging cable point.
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
      setShowCableModal(true);
      setErrorMsg('');
    };

    map.on('click', handlePick);

    return () => {
      map.off('click', handlePick);
      container.style.cursor = '';
    };
  }, [isPickingLocation]);

  // Render markers whenever data/selection changes.
  useEffect(() => {
    if (!mapRef.current || !markerLayerRef.current) return;

    mapRef.current.invalidateSize(true);
    markerLayerRef.current.clearLayers();
    const bounds = [];

    mapPoints.forEach((point) => {
      if (point.latitude === null || point.longitude === null) return;
      const isActive = selectedCable?.id === point.id;
      const marker = L.marker([point.latitude, point.longitude], {
        icon: createCableIcon(point, isActive),
        title: point.name || point.id
      });

      marker.bindPopup(`
        <div style="min-width:190px">
          <strong>${point.name || point.id}</strong><br />
          <span>${point.id} • ${point.type || '-'}</span><br />
          <span>${point.stationName || '-'}</span><br />
          <span>Slot: ${point.slotId || '-'}</span><br />
          <span>Status: ${statusLabel(point.status)}</span>
        </div>
      `);
      marker.on('click', () => setSelectedCable(point));
      marker.addTo(markerLayerRef.current);
      bounds.push([point.latitude, point.longitude]);
    });

    if (bounds.length > 0) {
      const latLngBounds = L.latLngBounds(bounds);
      mapRef.current.fitBounds(latLngBounds.pad(0.22), { maxZoom: 15 });
    } else {
      mapRef.current.setView(JAKARTA_CENTER, 12);
    }
  }, [mapPoints, selectedCable?.id]);

  const getAvailableSlots = (stationId, currentCableId = null) => {
    const station = stationById.get(stationId);
    const slots = Array.isArray(station?.slots) ? station.slots : [];
    return slots.filter((slot) => !slot.batteryId || slot.batteryId === currentCableId);
  };

  const getCableSlotId = (cable) => {
    if (cable?.slotId) return String(cable.slotId);
    const station = stationById.get(cable?.currentStationId);
    const slot = station?.slots?.find((item) => item.batteryId === cable?.id);
    return slot?.slotId ? String(slot.slotId) : '';
  };

  const getDefaultSlotId = (stationId, currentCableId = null) => {
    const slots = getAvailableSlots(stationId, currentCableId);
    return slots[0]?.slotId ? String(slots[0].slotId) : '';
  };

  const getDefaultCableForm = () => {
    const nextId = `CBL-${String(cables.length + 1).padStart(3, '0')}`;
    const firstStation = stations[0];
    const center = mapRef.current?.getCenter();

    return {
      ...emptyCableForm,
      id: nextId,
      name: `Kabel Charger ${nextId}`,
      currentStationId: firstStation?.id || '',
      slotId: getDefaultSlotId(firstStation?.id || ''),
      latitude: center?.lat?.toFixed(8) || firstStation?.latitude || String(JAKARTA_CENTER[0]),
      longitude: center?.lng?.toFixed(8) || firstStation?.longitude || String(JAKARTA_CENTER[1])
    };
  };

  const startPickLocation = ({ mode = formMode, nextForm = form } = {}) => {
    setFormMode(mode);
    setForm(nextForm);
    setFormError('');
    setShowCableModal(false);
    setIsPickingLocation(true);
    setErrorMsg('Mode pick location aktif. Klik titik pada peta Leaflet untuk menentukan koordinat kabel charger.');
  };

  const openAddModal = () => {
    startPickLocation({ mode: 'create', nextForm: getDefaultCableForm() });
  };

  const openEditModal = (cable) => {
    if (!cable) return;
    setForm({
      id: cable.id,
      name: cable.name || cable.id,
      type: cable.type || 'Type 2 AC',
      powerWatt: String(cable.powerWatt || 2200),
      pricePerKwh: String(cable.pricePerKwh || 2500),
      currentStationId: cable.currentStationId || '',
      slotId: getCableSlotId(cable),
      latitude: cable.latitude !== null && cable.latitude !== undefined ? String(cable.latitude) : '',
      longitude: cable.longitude !== null && cable.longitude !== undefined ? String(cable.longitude) : '',
      locationNote: cable.locationNote || '',
      status: cable.status || 'ready',
      stateOfHealth: String(cable.stateOfHealth || 100)
    });
    setFormMode('edit');
    setFormError('');
    setShowCableModal(true);
  };

  const pickLocationForSelectedCable = () => {
    if (!selectedCable) return;
    openEditModal(selectedCable);
    const nextForm = {
      id: selectedCable.id,
      name: selectedCable.name || selectedCable.id,
      type: selectedCable.type || 'Type 2 AC',
      powerWatt: String(selectedCable.powerWatt || 2200),
      pricePerKwh: String(selectedCable.pricePerKwh || 2500),
      currentStationId: selectedCable.currentStationId || '',
      slotId: getCableSlotId(selectedCable),
      latitude: selectedCable.latitude !== null && selectedCable.latitude !== undefined ? String(selectedCable.latitude) : '',
      longitude: selectedCable.longitude !== null && selectedCable.longitude !== undefined ? String(selectedCable.longitude) : '',
      locationNote: selectedCable.locationNote || '',
      status: selectedCable.status || 'ready',
      stateOfHealth: String(selectedCable.stateOfHealth || 100)
    };
    startPickLocation({ mode: 'edit', nextForm });
  };

  const handleStationChange = (stationId) => {
    const station = stationById.get(stationId);
    setForm((current) => ({
      ...current,
      currentStationId: stationId,
      slotId: getDefaultSlotId(stationId, current.id),
      latitude: station?.latitude || current.latitude,
      longitude: station?.longitude || current.longitude
    }));
  };

  const useMapCenter = () => {
    const center = mapRef.current?.getCenter();
    if (!center) return;
    setForm((current) => ({
      ...current,
      latitude: center.lat.toFixed(8),
      longitude: center.lng.toFixed(8)
    }));
  };

  const submitCablePoint = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!form.id || !form.type || !form.latitude || !form.longitude) {
      setFormError('ID kabel, tipe connector, latitude, dan longitude wajib diisi.');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: form.name,
        type: form.type,
        powerWatt: parseInt(form.powerWatt, 10),
        pricePerKwh: parseInt(form.pricePerKwh, 10),
        currentStationId: form.currentStationId || null,
        slotId: form.slotId ? parseInt(form.slotId, 10) : null,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        locationNote: form.locationNote,
        status: form.status,
        stateOfHealth: parseInt(form.stateOfHealth, 10)
      };

      const response = formMode === 'edit'
        ? await api.put(`/batteries/${form.id}`, payload)
        : await api.post('/batteries', { id: form.id, ...payload });

      await loadData();
      setSelectedCable(response.data.data);
      setShowCableModal(false);
    } catch (error) {
      console.error('Gagal menyimpan titik kabel:', error);
      setFormError(error.response?.data?.message || 'Gagal menyimpan titik kabel charger.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchQr = async (cable, regenerate = false) => {
    if (!cable?.id) return;

    setQrLoading(true);
    setQrError('');
    setQrModal({ cable, qrImage: null, qrString: '', payload: null });

    try {
      const response = regenerate
        ? await api.post(`/batteries/${cable.id}/regenerate-qr`)
        : await api.get(`/batteries/${cable.id}/qr`);
      setQrModal(response.data.data);
      await loadData();
    } catch (error) {
      console.error('Gagal generate QR:', error);
      setQrError(error.response?.data?.message || 'Gagal generate QR code kabel charger.');
    } finally {
      setQrLoading(false);
    }
  };

  const deleteCablePoint = async (cable) => {
    if (!cable?.id) return;
    const ok = window.confirm(`Hapus titik kabel ${cable.name || cable.id}? Tindakan ini hanya berhasil jika kabel belum memiliki riwayat charging.`);
    if (!ok) return;

    setDeleting(true);
    setErrorMsg('');
    try {
      await api.delete(`/batteries/${cable.id}`);
      setSelectedCable(null);
      await loadData();
    } catch (error) {
      console.error('Gagal menghapus titik kabel:', error);
      setErrorMsg(error.response?.data?.message || 'Gagal menghapus titik kabel charger.');
    } finally {
      setDeleting(false);
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setQrError('QR string berhasil disalin.');
    } catch (error) {
      setQrError('Browser tidak mengizinkan copy otomatis.');
    }
  };

  const printQr = () => {
    if (!qrModal?.qrImage) return;
    const win = window.open('', '_blank', 'width=420,height=640');
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>QR Kabel Charger ${qrModal.cable.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; text-align: center; color: #0f172a; }
            .card { border: 2px solid #0f172a; border-radius: 20px; padding: 24px; }
            img { width: 280px; height: 280px; }
            h1 { font-size: 22px; margin: 12px 0 4px; }
            p { margin: 4px 0; font-size: 13px; }
            .id { font-weight: 800; font-size: 16px; letter-spacing: 1px; }
          </style>
        </head>
        <body>
          <div class="card">
            <p>SPBKLU Charging Point</p>
            <img src="${qrModal.qrImage}" alt="QR" />
            <h1>${qrModal.cable.name || qrModal.cable.id}</h1>
            <p class="id">${qrModal.cable.id}</p>
            <p>Scan melalui APK SPBKLU untuk mulai pengisian kendaraan.</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-4 text-sm text-slate-500 font-semibold">Memuat Peta Titik Kabel Charger...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes pulse { 0%,100% { transform: scale(.75); opacity:.5; } 50% { transform: scale(1.35); opacity:.08; } }
        .leaflet-container { font-family: Inter, system-ui, sans-serif; }
        .leaflet-popup-content-wrapper { border-radius: 14px; }
      `}</style>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Peta QR Charger Leaflet</h1>
          <p className="text-sm font-medium text-slate-500">
            Peta real menggunakan Leaflet + OpenStreetMap. Tempatkan titik kabel/selang cas, generate QR, edit, atau hapus titik yang tidak dipakai.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setRefreshing(true); loadData(); }}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 font-bold text-sm rounded-xl text-slate-700 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition shadow-md shadow-emerald-500/15 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Pick Titik Kabel Baru
          </button>
        </div>
      </div>

      {errorMsg && !isPickingLocation && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-600 flex items-start gap-3 text-sm font-bold">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>{errorMsg}</div>
        </div>
      )}

      {isPickingLocation && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-bold">
          <div className="flex items-start gap-3">
            <Crosshair className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <div>Klik lokasi di peta untuk menentukan titik kabel charger.</div>
              <div className="text-xs font-semibold text-emerald-600 mt-0.5">Setelah klik, form {formMode === 'edit' ? 'edit' : 'tambah'} akan terbuka dengan koordinat terisi otomatis.</div>
            </div>
          </div>
          <button
            onClick={() => { setIsPickingLocation(false); setErrorMsg(''); }}
            className="px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-black text-emerald-700 hover:bg-emerald-100"
          >
            Batal Pick
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-800">Peta Operasional Leaflet</h3>
              <p className="text-xs font-semibold text-slate-400">Pan, zoom, dan marker interaktif seperti aplikasi peta modern.</p>
            </div>
            <div className="text-xs font-bold text-slate-400 bg-slate-50 border px-3 py-1.5 rounded-lg">
              {mapPoints.length} Titik Kabel
            </div>
          </div>
          <div ref={mapContainerRef} className="spbklu-leaflet-map h-[620px] w-full bg-slate-100" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[620px]">
          {selectedCable ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Titik Kabel</span>
                  <h3 className="text-lg font-black text-slate-800 mt-1">{selectedCable.name || selectedCable.id}</h3>
                  <p className="text-xs font-bold text-slate-400">ID: {selectedCable.id}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${statusClasses(selectedCable.status)}`}>
                  {statusLabel(selectedCable.status)}
                </span>
              </div>

              <div className="space-y-3 text-sm font-semibold text-slate-600">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Stasiun</span>
                  <span className="font-extrabold text-slate-800 text-right">{selectedCable.stationName || selectedCable.currentStationId || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Slot Charger</span>
                  <span className="font-extrabold text-slate-800">Slot {selectedCable.slotId || getCableSlotId(selectedCable) || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Tipe Connector</span>
                  <span className="font-extrabold text-slate-800">{selectedCable.type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Daya Maksimum</span>
                  <span className="font-extrabold text-emerald-600">{selectedCable.powerWatt || 2200} W</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Tarif/kWh</span>
                  <span className="font-extrabold text-slate-800">Rp {Number(selectedCable.pricePerKwh || 2500).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">Koordinat</span>
                  <span className="font-extrabold text-slate-800 text-right">{formatCoord(selectedCable.latitude)}, {formatCoord(selectedCable.longitude)}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed">
                  <span className="text-slate-400 font-black uppercase block mb-1">Catatan Lokasi</span>
                  {selectedCable.locationNote || 'Belum ada catatan lokasi fisik.'}
                </div>
              </div>

              <button
                onClick={() => fetchQr(selectedCable)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl transition shadow-md active:scale-95"
              >
                <QrCode className="h-5 w-5" />
                Generate QR untuk User
              </button>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => openEditModal(selectedCable)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  <Edit3 className="h-4 w-4" /> Edit Data
                </button>
                <button
                  onClick={pickLocationForSelectedCable}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 font-bold text-xs rounded-xl transition"
                >
                  <Crosshair className="h-4 w-4" /> Pick Lokasi
                </button>
                <button
                  onClick={() => deleteCablePoint(selectedCable)}
                  disabled={deleting}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-bold text-xs rounded-xl transition disabled:opacity-50"
                >
                  {deleting ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Hapus
                </button>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 text-xs font-semibold text-emerald-700 leading-relaxed">
                <Zap className="h-5 w-5 shrink-0 fill-current" />
                <span>QR ini ditempel pada unit SPBKLU. User Android akan scan QR, lalu menginput nominal/watt pengisian sebelum transaksi charging dibuat.</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
              <MapPin className="h-14 w-14 text-slate-300" />
              <div>
                <h4 className="font-extrabold text-slate-700">Pilih Titik Kabel</h4>
                <p className="text-xs font-semibold max-w-xs mt-1">Klik pin kabel di peta Leaflet untuk melihat detail, edit, hapus, dan generate QR code.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCableModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Cable className="h-5 w-5 text-emerald-500" />
                {formMode === 'edit' ? 'Edit Titik Kabel' : 'Tambah Titik Kabel di Peta'}
              </h3>
              <button onClick={() => setShowCableModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitCablePoint} className="p-6 space-y-4">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-600 flex items-start gap-3 text-xs font-bold">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <div>{formError}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">ID Kabel</label>
                  <input value={form.id} disabled={formMode === 'edit'} onChange={(e) => setForm({ ...form, id: e.target.value })} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-extrabold text-sm disabled:opacity-60" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Label</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-semibold text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Tipe</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm">
                    <option value="Type 2 AC">Type 2 AC</option>
                    <option value="CCS2 DC">CCS2 DC Fast</option>
                    <option value="CHAdeMO DC">CHAdeMO DC</option>
                    <option value="GB/T AC">GB/T AC</option>
                    <option value="Custom Cable">Custom Cable</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Max Watt</label>
                  <input type="number" min="1" value={form.powerWatt} onChange={(e) => setForm({ ...form, powerWatt: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Tarif/kWh</label>
                  <input type="number" min="0" value={form.pricePerKwh} onChange={(e) => setForm({ ...form, pricePerKwh: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm">
                    <option value="ready">Ready</option>
                    <option value="idle">Idle</option>
                    <option value="charging">Charging</option>
                    <option value="faulty">Faulty</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Stasiun</label>
                  <select value={form.currentStationId} onChange={(e) => handleStationChange(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm">
                    <option value="">Tidak terikat</option>
                    {stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Slot</label>
                  <select
                    value={form.slotId}
                    onChange={(e) => setForm({ ...form, slotId: e.target.value })}
                    disabled={!form.currentStationId}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm disabled:opacity-60"
                  >
                    <option value="">Auto</option>
                    {getAvailableSlots(form.currentStationId, form.id).map((slot) => (
                      <option key={slot.slotId} value={slot.slotId}>Slot {slot.slotId}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Latitude</label>
                  <input value={form.latitude} readOnly required title="Gunakan tombol Pick Lokasi di Peta untuk mengubah latitude" className="w-full px-4 py-2.5 bg-slate-100 border border-slate-250 rounded-xl text-slate-500 font-semibold text-sm cursor-not-allowed" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Longitude</label>
                  <input value={form.longitude} readOnly required title="Gunakan tombol Pick Lokasi di Peta untuk mengubah longitude" className="w-full px-4 py-2.5 bg-slate-100 border border-slate-250 rounded-xl text-slate-500 font-semibold text-sm cursor-not-allowed" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <button type="button" onClick={() => startPickLocation({ mode: formMode, nextForm: form })} className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-100">
                  <Crosshair className="h-4 w-4" /> Pick Lokasi di Peta
                </button>
                <button type="button" onClick={useMapCenter} className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">
                  <Navigation className="h-4 w-4" /> Gunakan Titik Tengah Peta
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Catatan Lokasi Fisik</label>
                <input value={form.locationNote} onChange={(e) => setForm({ ...form, locationNote: e.target.value })} placeholder="Contoh: sisi kiri parkiran basement, dekat gate B" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-semibold text-sm" />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowCableModal(false)} className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 font-bold text-sm text-slate-600 rounded-xl transition">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-bold text-sm text-white rounded-xl shadow-lg disabled:opacity-50 transition flex items-center justify-center gap-1.5">
                  {isSubmitting ? <Loader className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 stroke-[3]" /> {formMode === 'edit' ? 'Update Titik' : 'Simpan Titik'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <QrCode className="h-5 w-5 text-emerald-500" />
                QR Kabel Charger
              </h3>
              <button onClick={() => setQrModal(null)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {qrError && (
                <div className={`${qrError.includes('berhasil') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'} border p-3 rounded-xl flex items-start gap-2 text-xs font-bold`}>
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{qrError}</span>
                </div>
              )}

              {qrLoading ? (
                <div className="h-80 flex flex-col items-center justify-center">
                  <Loader className="h-8 w-8 animate-spin text-emerald-500" />
                  <span className="mt-3 text-xs text-slate-400 font-bold">Generate QR Code...</span>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center">
                    {qrModal.qrImage && <img src={qrModal.qrImage} alt="QR Kabel Charger" className="w-72 h-72 rounded-xl bg-white border border-slate-100" />}
                    <h4 className="mt-3 font-black text-slate-800">{qrModal.cable?.name || qrModal.cable?.id}</h4>
                    <p className="text-xs font-bold text-slate-400">{qrModal.cable?.id}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => copyText(qrModal.qrString)} className="py-2.5 border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-600 rounded-xl transition flex items-center justify-center gap-1.5">
                      <Copy className="h-4 w-4" /> Copy String
                    </button>
                    <a href={qrModal.qrImage} download={`${qrModal.cable?.id || 'spbklu'}-qr.png`} className="py-2.5 bg-emerald-500 hover:bg-emerald-600 font-bold text-xs text-white rounded-xl transition flex items-center justify-center gap-1.5">
                      <Download className="h-4 w-4" /> Download PNG
                    </a>
                    <button onClick={printQr} className="py-2.5 border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-600 rounded-xl transition flex items-center justify-center gap-1.5">
                      <Printer className="h-4 w-4" /> Print Label
                    </button>
                    <button onClick={() => fetchQr(qrModal.cable, true)} className="py-2.5 bg-slate-900 hover:bg-slate-800 font-bold text-xs text-white rounded-xl transition flex items-center justify-center gap-1.5">
                      <RotateCcw className="h-4 w-4" /> Regenerate
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed text-center">
                    Regenerate akan mengganti token QR. QR lama menjadi tidak valid untuk flow scan berikutnya.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargerMap;
