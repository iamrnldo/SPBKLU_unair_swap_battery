import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import Table from '../components/Table';
import { formatDate } from '../utils/formatter';
import {
  Battery as BatteryIcon,
  Plus,
  Search,
  X,
  Check,
  Loader,
  AlertTriangle,
  Heart,
  MapPin,
  Edit3,
  Trash2,
  RefreshCw,
  Boxes
} from 'lucide-react';

const initialForm = {
  id: '',
  type: '60V/20Ah',
  chargeLevel: '100',
  stateOfHealth: '100',
  currentStationId: '',
  slotId: '',
  status: 'idle'
};

const Batteries = () => {
  const [batteries, setBatteries] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageError, setPageError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [form, setForm] = useState(initialForm);
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setPageError('');
      const [batteryRes, stationRes] = await Promise.all([
        api.get('/batteries'),
        api.get('/stations')
      ]);
      setBatteries(batteryRes.data.data || []);
      setStations(stationRes.data.data || []);
    } catch (error) {
      console.error('Gagal mengambil data baterai:', error);
      setPageError(error.response?.data?.message || 'Gagal mengambil data baterai.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stationById = useMemo(() => {
    const map = new Map();
    stations.forEach((station) => map.set(station.id, station));
    return map;
  }, [stations]);

  const locationStats = useMemo(() => {
    const grouped = {};
    stations.forEach((station) => {
      const stationBatteries = batteries.filter((battery) => battery.currentStationId === station.id);
      const byType = stationBatteries.reduce((acc, battery) => {
        acc[battery.type] = (acc[battery.type] || 0) + 1;
        return acc;
      }, {});
      grouped[station.id] = {
        total: stationBatteries.length,
        byType
      };
    });
    return grouped;
  }, [stations, batteries]);

  const globalTypeStats = useMemo(() => {
    return batteries.reduce((acc, battery) => {
      acc[battery.type] = (acc[battery.type] || 0) + 1;
      return acc;
    }, {});
  }, [batteries]);

  const getBatterySlotId = (battery) => {
    if (battery?.slotId) return String(battery.slotId);
    const station = stationById.get(battery?.currentStationId);
    const slot = station?.slots?.find((item) => item.batteryId === battery?.id);
    return slot?.slotId ? String(slot.slotId) : '';
  };

  const getAvailableSlots = (stationId, currentBatteryId = null) => {
    const station = stationById.get(stationId);
    const slots = Array.isArray(station?.slots) ? station.slots : [];
    return slots.filter((slot) => !slot.batteryId || slot.batteryId === currentBatteryId);
  };

  const getDefaultSlotId = (stationId, currentBatteryId = null) => {
    const slots = getAvailableSlots(stationId, currentBatteryId);
    return slots[0]?.slotId ? String(slots[0].slotId) : '';
  };

  const openAddModal = () => {
    const nextId = `BT-${String(100 + batteries.length + 1).padStart(3, '0')}`;
    setSelectedBattery(null);
    setForm({ ...initialForm, id: nextId });
    setFormMode('create');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (battery) => {
    setSelectedBattery(battery);
    setForm({
      id: battery.id,
      type: battery.type || '60V/20Ah',
      chargeLevel: String(battery.chargeLevel ?? 100),
      stateOfHealth: String(battery.stateOfHealth ?? 100),
      currentStationId: battery.currentStationId || '',
      slotId: getBatterySlotId(battery),
      status: battery.status || 'idle'
    });
    setFormMode('edit');
    setFormError('');
    setShowModal(true);
  };

  const handleStationChange = (stationId) => {
    setForm((current) => ({
      ...current,
      currentStationId: stationId,
      slotId: stationId ? getDefaultSlotId(stationId, current.id) : '',
      status: stationId && current.status === 'idle' ? 'ready' : current.status
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!form.id || !form.type) {
      setFormError('ID Baterai dan Tipe wajib diisi');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        type: form.type,
        chargeLevel: parseInt(form.chargeLevel, 10),
        stateOfHealth: parseInt(form.stateOfHealth, 10),
        currentStationId: form.currentStationId || null,
        slotId: form.slotId ? parseInt(form.slotId, 10) : null,
        status: form.status
      };

      if (formMode === 'edit') {
        await api.put(`/batteries/${form.id}`, payload);
      } else {
        await api.post('/batteries', { id: form.id, ...payload });
      }

      await fetchData();
      setShowModal(false);
    } catch (error) {
      console.error('Gagal menyimpan baterai:', error);
      setFormError(error.response?.data?.message || error.message || 'Gagal menyimpan baterai');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (battery) => {
    const ok = window.confirm(`Hapus baterai ${battery.id}? Slot penempatan baterai akan dikosongkan.`);
    if (!ok) return;

    setDeletingId(battery.id);
    setPageError('');
    try {
      await api.delete(`/batteries/${battery.id}`);
      await fetchData();
    } catch (error) {
      console.error('Gagal menghapus baterai:', error);
      setPageError(error.response?.data?.message || 'Gagal menghapus baterai.');
    } finally {
      setDeletingId('');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">Siap Diambil</span>;
      case 'charging': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">Charging</span>;
      case 'in-use': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600 border border-purple-100">Di User</span>;
      case 'faulty': return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">Rusak</span>;
      default: return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-600 border border-slate-100">Idle / Gudang</span>;
    }
  };

  const getLocationLabel = (battery) => {
    if (battery.currentStationId) {
      const station = stationById.get(battery.currentStationId);
      return <span className="font-semibold text-slate-700">{station?.name || 'Stasiun'} <span className="text-blue-600 font-extrabold">({battery.currentStationId})</span>{getBatterySlotId(battery) ? ` • Slot ${getBatterySlotId(battery)}` : ''}</span>;
    }
    if (battery.currentUserId) {
      return <span className="font-semibold text-slate-700">User ID <span className="text-purple-600 font-extrabold">#{battery.currentUserId}</span></span>;
    }
    return <span className="text-slate-400 font-medium italic">Gudang / Idle</span>;
  };

  const getHealthColor = (soh) => {
    if (soh >= 90) return 'text-emerald-500';
    if (soh >= 80) return 'text-orange-500';
    return 'text-rose-500';
  };

  const filteredBatteries = batteries.filter((battery) => {
    const keyword = searchQuery.toLowerCase();
    return (
      battery.id?.toLowerCase().includes(keyword) ||
      battery.type?.toLowerCase().includes(keyword) ||
      battery.status?.toLowerCase().includes(keyword) ||
      battery.currentStationId?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Database Baterai Swap</h1>
          <p className="text-sm font-medium text-slate-500">Kelola titik lokasi baterai, penempatan slot, jumlah baterai per lokasi, dan total tipe baterai.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition shadow-sm">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition shadow-md shadow-emerald-500/15 active:scale-95">
            <Plus className="h-5 w-5" /> Registrasi Baterai
          </button>
        </div>
      </div>

      {pageError && <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-600 flex items-start gap-3 text-sm font-bold"><AlertTriangle className="h-5 w-5 shrink-0" />{pageError}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Battery</span>
          <div className="mt-1 text-2xl font-black text-slate-800">{batteries.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm lg:col-span-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Boxes className="h-3.5 w-3.5" /> Total per Tipe</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(globalTypeStats).map(([type, total]) => (
              <span key={type} className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-black">{type}: {total}</span>
            ))}
            {Object.keys(globalTypeStats).length === 0 && <span className="text-xs text-slate-400 font-bold">Belum ada data baterai</span>}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div>
          <h3 className="text-sm font-black text-slate-800">Jumlah Battery per Lokasi</h3>
          <p className="text-xs text-slate-400 font-semibold">Jumlah baterai yang ditempatkan pada setiap titik stasiun.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {stations.map((station) => {
            const stat = locationStats[station.id] || { total: 0, byType: {} };
            return (
              <div key={station.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-600">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-black text-slate-800 block">{station.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{station.id} • {station.slots?.length || 0} slot</span>
                  </div>
                  <span className="bg-white border px-2 py-1 rounded-lg font-black text-emerald-600">{stat.total} Battery</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(stat.byType).map(([type, total]) => <span key={type} className="bg-white border px-2 py-0.5 rounded-md text-[10px] font-black">{type}: {total}</span>)}
                  {Object.keys(stat.byType).length === 0 && <span className="text-[10px] text-slate-400 font-bold">Belum ada battery di lokasi ini</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex bg-white p-4 border border-slate-200 rounded-xl shadow-sm justify-between items-center gap-4">
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Search className="h-5 w-5" /></span>
          <input type="text" placeholder="Cari ID, tipe, status, atau lokasi stasiun..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-sm font-semibold transition-all" />
        </div>
        <div className="text-xs font-bold text-slate-400 bg-slate-50 border px-3 py-1.5 rounded-lg">Tampil: <span className="text-slate-700 font-extrabold">{filteredBatteries.length}</span></div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center"><div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div><span className="mt-4 text-sm text-slate-500 font-semibold">Mengambil Data Baterai...</span></div>
      ) : (
        <Table headers={['Serial ID', 'Tipe', 'SOC', 'SOH', 'Lokasi / Slot', 'Status', 'Aksi', 'Tanggal']} emptyMessage="Tidak ada baterai yang ditemukan.">
          {filteredBatteries.map((battery) => (
            <tr key={battery.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="p-1.5 bg-slate-100 rounded-md text-slate-500 border"><BatteryIcon className="h-4 w-4" /></div><span className="font-extrabold text-slate-800 text-sm">{battery.id}</span></div></td>
              <td className="px-6 py-4 font-semibold text-slate-600 text-sm">{battery.type}</td>
              <td className="px-6 py-4"><span className="text-sm font-black text-slate-800">{battery.chargeLevel || 0}%</span></td>
              <td className="px-6 py-4"><div className="flex items-center gap-1.5 font-black text-sm"><Heart className={`h-4 w-4 fill-current ${getHealthColor(battery.stateOfHealth || 100)}`} /><span className={getHealthColor(battery.stateOfHealth || 100)}>{battery.stateOfHealth || 100}%</span></div></td>
              <td className="px-6 py-4 text-sm font-semibold"><div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" />{getLocationLabel(battery)}</div></td>
              <td className="px-6 py-4">{getStatusBadge(battery.status)}</td>
              <td className="px-6 py-4"><div className="flex items-center gap-2"><button onClick={() => openEditModal(battery)} className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition" title="Edit baterai"><Edit3 className="h-4 w-4" /></button><button onClick={() => handleDelete(battery)} disabled={deletingId === battery.id} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg transition disabled:opacity-50" title="Hapus baterai">{deletingId === battery.id ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button></div></td>
              <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(battery.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all animate-scaleUp">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between"><h3 className="text-base font-black text-slate-800 flex items-center gap-2"><BatteryIcon className="h-5 w-5 text-emerald-500" />{formMode === 'edit' ? 'Edit Penempatan Battery' : 'Registrasi Battery Baru'}</h3><button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition"><X className="h-5 w-5" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-600 flex items-start gap-3 text-xs font-bold"><AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" />{formError}</div>}
              <div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Serial ID Battery</label><input type="text" required disabled={formMode === 'edit'} value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="e.g. BT-902" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-extrabold text-sm disabled:opacity-60" /></div><div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Tipe Battery</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm"><option value="60V/20Ah">60V / 20Ah</option><option value="60V/24Ah">60V / 24Ah</option><option value="72V/20Ah">72V / 20Ah</option></select></div></div>
              <div className="grid grid-cols-3 gap-4"><div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">SOC (%)</label><input type="number" min="0" max="100" required value={form.chargeLevel} onChange={(e) => setForm({ ...form, chargeLevel: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm" /></div><div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">SOH (%)</label><input type="number" min="1" max="100" required value={form.stateOfHealth} onChange={(e) => setForm({ ...form, stateOfHealth: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm" /></div><div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm"><option value="ready">Ready / Siap Diambil</option><option value="charging">Charging</option><option value="idle">Idle / Gudang</option><option value="faulty">Faulty</option><option value="in-use">In Use / Di User</option></select></div></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Lokasi Stasiun</label><select value={form.currentStationId} onChange={(e) => handleStationChange(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm"><option value="">Gudang / Tidak ditempatkan</option>{stations.map((station) => <option key={station.id} value={station.id}>{station.name} ({station.id})</option>)}</select></div><div className="space-y-1.5"><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Slot Battery</label><select value={form.slotId} onChange={(e) => setForm({ ...form, slotId: e.target.value })} disabled={!form.currentStationId} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm disabled:opacity-60"><option value="">Auto slot kosong pertama</option>{getAvailableSlots(form.currentStationId, form.id).map((slot) => <option key={slot.slotId} value={slot.slotId}>Slot {slot.slotId}{slot.batteryId === form.id ? ' (saat ini)' : ''}</option>)}</select></div></div>
              <div className="bg-slate-50 border rounded-xl p-3 text-xs font-semibold text-slate-500">Jika lokasi stasiun dipilih, battery akan ditempatkan ke slot yang dipilih. Jika slot tidak dipilih, sistem otomatis memakai slot kosong pertama.</div>
              <div className="flex gap-3 pt-4 border-t border-slate-100"><button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 font-bold text-sm text-slate-600 rounded-xl transition">Batal</button><button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-bold text-sm text-white rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition flex items-center justify-center gap-1.5">{isSubmitting ? <Loader className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 stroke-[3]" /> {formMode === 'edit' ? 'Update Battery' : 'Simpan Battery'}</>}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Batteries;
