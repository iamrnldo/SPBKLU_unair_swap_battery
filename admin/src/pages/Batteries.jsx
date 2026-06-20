import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Table from '../components/Table';
import { formatDate } from '../utils/formatter';
import {
  Cable,
  Plus,
  Search,
  X,
  Check,
  Loader,
  AlertTriangle,
  Heart,
  Zap,
  MapPin,
  QrCode,
  Edit3,
  Trash2,
  RefreshCw
} from 'lucide-react';

const initialCableForm = {
  id: '',
  name: '',
  type: 'Type 2 AC',
  stateOfHealth: '100',
  powerWatt: '2200',
  pricePerKwh: '2500',
  currentStationId: '',
  slotId: '',
  latitude: '',
  longitude: '',
  locationNote: '',
  status: 'ready'
};

const Batteries = () => {
  const [cables, setCables] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageError, setPageError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [form, setForm] = useState(initialCableForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setPageError('');
      const [cableRes, stationRes] = await Promise.all([
        api.get('/batteries'),
        api.get('/stations')
      ]);
      setCables(cableRes.data.data || []);
      setStations(stationRes.data.data || []);
    } catch (error) {
      console.error('Gagal mengambil data kabel charger:', error);
      setPageError(error.response?.data?.message || 'Gagal mengambil data kabel charger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stationById = stations.reduce((acc, station) => {
    acc[station.id] = station;
    return acc;
  }, {});

  const getAvailableSlots = (stationId, currentCableId = null) => {
    const station = stationById[stationId];
    const slots = Array.isArray(station?.slots) ? station.slots : [];
    return slots.filter((slot) => !slot.batteryId || slot.batteryId === currentCableId);
  };

  const getCableSlotId = (cable) => {
    if (cable?.slotId) return String(cable.slotId);
    const station = stationById[cable?.currentStationId];
    const slot = station?.slots?.find((item) => item.batteryId === cable?.id);
    return slot?.slotId ? String(slot.slotId) : '';
  };

  const getDefaultSlotId = (stationId, currentCableId = null) => {
    const slots = getAvailableSlots(stationId, currentCableId);
    return slots[0]?.slotId ? String(slots[0].slotId) : '';
  };

  const openAddModal = () => {
    const nextId = `CBL-${String(cables.length + 1).padStart(3, '0')}`;
    const firstStation = stations[0];
    setForm({
      ...initialCableForm,
      id: nextId,
      name: `Kabel Charger ${nextId}`,
      currentStationId: firstStation?.id || '',
      slotId: getDefaultSlotId(firstStation?.id || ''),
      latitude: firstStation?.latitude || '-6.',
      longitude: firstStation?.longitude || '106.'
    });
    setFormMode('create');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (cable) => {
    setForm({
      id: cable.id,
      name: cable.name || cable.id,
      type: cable.type || 'Type 2 AC',
      stateOfHealth: String(cable.stateOfHealth || 100),
      powerWatt: String(cable.powerWatt || 2200),
      pricePerKwh: String(cable.pricePerKwh || 2500),
      currentStationId: cable.currentStationId || '',
      slotId: getCableSlotId(cable),
      latitude: cable.latitude !== null && cable.latitude !== undefined ? String(cable.latitude) : '',
      longitude: cable.longitude !== null && cable.longitude !== undefined ? String(cable.longitude) : '',
      locationNote: cable.locationNote || '',
      status: cable.status || 'ready'
    });
    setFormMode('edit');
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleStationChange = (stationId) => {
    const station = stationById[stationId];
    setForm((current) => ({
      ...current,
      currentStationId: stationId,
      slotId: getDefaultSlotId(stationId, current.id),
      latitude: station?.latitude || current.latitude,
      longitude: station?.longitude || current.longitude
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!form.id || !form.type) {
      setFormError('ID Kabel dan Tipe Connector wajib diisi');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: form.name,
        type: form.type,
        stateOfHealth: parseInt(form.stateOfHealth, 10),
        powerWatt: parseInt(form.powerWatt, 10),
        pricePerKwh: parseInt(form.pricePerKwh, 10),
        currentStationId: form.currentStationId || null,
        slotId: form.slotId ? parseInt(form.slotId, 10) : null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        locationNote: form.locationNote,
        status: form.status
      };

      if (formMode === 'edit') {
        await api.put(`/batteries/${form.id}`, payload);
      } else {
        await api.post('/batteries', { id: form.id, ...payload });
      }

      await fetchData();
      closeModal();
    } catch (error) {
      console.error('Gagal menyimpan kabel charger:', error);
      setFormError(error.response?.data?.message || error.message || 'Gagal menyimpan kabel charger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cable) => {
    const ok = window.confirm(`Hapus kabel charger ${cable.name || cable.id}? Hapus hanya bisa dilakukan jika kabel belum memiliki riwayat charging.`);
    if (!ok) return;

    setDeletingId(cable.id);
    setPageError('');
    try {
      await api.delete(`/batteries/${cable.id}`);
      await fetchData();
    } catch (error) {
      console.error('Gagal menghapus kabel charger:', error);
      setPageError(error.response?.data?.message || 'Gagal menghapus kabel charger.');
    } finally {
      setDeletingId('');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">Siap Scan</span>;
      case 'charging':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 animate-pulse">Sedang Mengecas</span>;
      case 'in-use':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600 border border-purple-100">Dipakai User</span>;
      case 'faulty':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">Bermasalah</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-600 border border-slate-100">Idle</span>;
    }
  };

  const getLocationLabel = (cable) => {
    if (cable.currentStationId) {
      const station = stationById[cable.currentStationId];
      return (
        <span className="font-semibold text-slate-700">
          {station?.name || 'Stasiun'} <span className="text-blue-600 font-extrabold">({cable.currentStationId})</span>
        </span>
      );
    }
    return <span className="text-slate-400 font-medium italic">Belum ditempatkan di peta</span>;
  };

  const getHealthColor = (soh) => {
    if (soh >= 90) return 'text-emerald-500';
    if (soh >= 80) return 'text-orange-500';
    return 'text-rose-500';
  };

  const filteredCables = cables.filter((cable) => {
    const keyword = searchQuery.toLowerCase();
    return (
      cable.id?.toLowerCase().includes(keyword) ||
      cable.name?.toLowerCase().includes(keyword) ||
      cable.type?.toLowerCase().includes(keyword) ||
      cable.status?.toLowerCase().includes(keyword) ||
      cable.currentStationId?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Database Kabel Charger</h1>
          <p className="text-sm font-medium text-slate-500">Daftarkan, edit, update status, atau hapus kabel/selang cas yang ditempatkan di peta QR Charger.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition shadow-sm">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition shadow-md shadow-emerald-500/15 active:scale-95">
            <Plus className="h-5 w-5" /> Registrasi Kabel Charger
          </button>
        </div>
      </div>

      {pageError && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-600 flex items-start gap-3 text-sm font-bold">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>{pageError}</div>
        </div>
      )}

      <div className="flex bg-white p-4 border border-slate-200 rounded-xl shadow-sm justify-between items-center gap-4">
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Search className="h-5 w-5" /></span>
          <input
            type="text"
            placeholder="Cari kabel berdasarkan ID, nama, tipe, stasiun..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-sm font-semibold transition-all"
          />
        </div>
        <div className="text-xs font-bold text-slate-400 bg-slate-50 border px-3 py-1.5 rounded-lg">
          Total Kabel: <span className="text-slate-700 font-extrabold">{cables.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="mt-4 text-sm text-slate-500 font-semibold">Mengambil Database Kabel Charger...</span>
        </div>
      ) : (
        <Table headers={['ID Kabel', 'Tipe Connector', 'Daya Maks', 'Health', 'Lokasi Peta', 'Status', 'QR', 'Aksi', 'Tanggal Registrasi']} emptyMessage="Tidak ada kabel charger yang ditemukan.">
          {filteredCables.map((cable) => (
            <tr key={cable.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 rounded-md text-slate-500 border"><Cable className="h-4 w-4" /></div>
                  <div>
                    <span className="font-extrabold text-slate-800 text-sm block">{cable.name || cable.id}</span>
                    <span className="text-[10px] font-bold text-slate-400">{cable.id}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 font-semibold text-slate-600 text-sm">{cable.type}</td>
              <td className="px-6 py-4 font-black text-emerald-600 text-sm">
                {cable.powerWatt || 2200} W
                <div className="text-[10px] text-slate-400 font-bold">Rp {Number(cable.pricePerKwh || 2500).toLocaleString('id-ID')}/kWh</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 font-black text-sm">
                  <Heart className={`h-4 w-4 fill-current ${getHealthColor(cable.stateOfHealth || 100)}`} />
                  <span className={getHealthColor(cable.stateOfHealth || 100)}>{cable.stateOfHealth || 100}%</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm font-semibold">
                <div>{getLocationLabel(cable)}</div>
                <div className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" />Slot {cable.slotId || getCableSlotId(cable) || '-'} • {cable.latitude || '-'}, {cable.longitude || '-'}</div>
              </td>
              <td className="px-6 py-4">{getStatusBadge(cable.status)}</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-600 border border-slate-100"><QrCode className="h-3.5 w-3.5" /> Via Peta</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditModal(cable)} className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition" title="Edit kabel"><Edit3 className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(cable)} disabled={deletingId === cable.id} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg transition disabled:opacity-50" title="Hapus kabel">
                    {deletingId === cable.id ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </td>
              <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(cable.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all animate-scaleUp">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2"><Cable className="h-5 w-5 text-emerald-500" />{formMode === 'edit' ? 'Edit Kabel Charger' : 'Registrasi Kabel Charger Baru'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-600 flex items-start gap-3 text-xs font-bold"><AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" /><div>{formError}</div></div>}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">ID Kabel</label>
                  <input type="text" required disabled={formMode === 'edit'} value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="e.g. CBL-001" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-extrabold text-sm focus:outline-none disabled:opacity-60" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Label</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kabel Charger Parkir A1" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-semibold text-sm" />
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
                <div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Max Watt</label><input type="number" min="1" required value={form.powerWatt} onChange={(e) => setForm({ ...form, powerWatt: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm" /></div>
                <div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Tarif/kWh</label><input type="number" min="0" required value={form.pricePerKwh} onChange={(e) => setForm({ ...form, pricePerKwh: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm" /></div>
                <div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm"><option value="ready">Ready</option><option value="idle">Idle</option><option value="charging">Charging</option><option value="faulty">Faulty</option></select></div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Stasiun</label><select value={form.currentStationId} onChange={(e) => handleStationChange(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm"><option value="">Belum ditempatkan</option>{stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}</select></div>
                <div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Slot</label><select value={form.slotId} onChange={(e) => setForm({ ...form, slotId: e.target.value })} disabled={!form.currentStationId} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm disabled:opacity-60"><option value="">Auto</option>{getAvailableSlots(form.currentStationId, form.id).map((slot) => <option key={slot.slotId} value={slot.slotId}>Slot {slot.slotId}</option>)}</select></div>
                <div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Latitude</label><input type="text" value={form.latitude} readOnly title="Latitude otomatis dari Peta QR Charger" className="w-full px-4 py-2.5 bg-slate-100 border border-slate-250 rounded-xl text-slate-500 font-semibold text-sm cursor-not-allowed" /></div>
                <div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Longitude</label><input type="text" value={form.longitude} readOnly title="Longitude otomatis dari Peta QR Charger" className="w-full px-4 py-2.5 bg-slate-100 border border-slate-250 rounded-xl text-slate-500 font-semibold text-sm cursor-not-allowed" /></div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Kondisi</label><input type="number" min="1" max="100" required value={form.stateOfHealth} onChange={(e) => setForm({ ...form, stateOfHealth: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm" /></div>
                <div className="col-span-2 space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Catatan Lokasi</label><input type="text" value={form.locationNote} onChange={(e) => setForm({ ...form, locationNote: e.target.value })} placeholder="Contoh: sisi kiri parkiran basement, dekat gate B" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-semibold text-sm" /></div>
              </div>

              <div className="bg-slate-50 border p-4 rounded-xl flex items-start gap-3 text-xs text-slate-500 leading-relaxed font-semibold"><Zap className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5 fill-current" /><span>Setelah kabel tersimpan, buka menu <b>Peta QR Charger</b> untuk generate, download, dan print QR Code.</span></div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 font-bold text-sm text-slate-600 rounded-xl transition">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-bold text-sm text-white rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition flex items-center justify-center gap-1.5">{isSubmitting ? <Loader className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 stroke-[3]" /> {formMode === 'edit' ? 'Update Kabel' : 'Simpan Kabel'}</>}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Batteries;
