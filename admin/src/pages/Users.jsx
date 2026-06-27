import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Table from '../components/Table';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/formatter';
import { 
  Search, 
  X, 
  Check, 
  Loader, 
  UserPlus, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  Lock,
  Mail,
  User,
  ShieldAlert
} from 'lucide-react';

const Users = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals visibility
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states (Add & Edit)
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Gagal mengambil data user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- CREATE / EDIT FUNCTIONS ---
  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user'
    });
    setSuccessMsg('');
    setErrorMsg('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (user) => {
    setIsEditMode(true);
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Blank password unless they want to change it
      role: user.role
    });
    setSuccessMsg('');
    setErrorMsg('');
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    if (!formData.name || !formData.email) {
      setErrorMsg('Nama dan email wajib diisi.');
      setIsSubmitting(false);
      return;
    }

    if (!isEditMode && !formData.password) {
      setErrorMsg('Password wajib diisi untuk akun baru.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (isEditMode) {
        // Edit User
        const response = await api.put(`/admin/users/${selectedUser.id}`, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password || undefined // Only send if not blank
        });
        setSuccessMsg('Akun berhasil diperbarui!');
      } else {
        // Add User
        const response = await api.post('/admin/users', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        });
        setSuccessMsg('Akun baru berhasil didaftarkan!');
      }

      fetchUsers();
      setTimeout(() => {
        setShowFormModal(false);
        setSelectedUser(null);
      }, 1500);
    } catch (error) {
      console.error('Gagal menyimpan user:', error);
      setErrorMsg(error.response?.data?.message || 'Gagal memproses data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DELETE FUNCTIONS ---
  const handleOpenDelete = (user) => {
    setSelectedUser(user);
    setErrorMsg('');
    setSuccessMsg('');
    setShowDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    
    // Prevent self-deletion
    if (selectedUser.id === currentAdmin?.id) {
      setErrorMsg('Anda tidak bisa menghapus akun Anda sendiri.');
      setIsSubmitting(false);
      return;
    }

    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      setSuccessMsg('Akun berhasil dihapus!');
      fetchUsers();
      setTimeout(() => {
        setShowDeleteModal(false);
        setSelectedUser(null);
      }, 1500);
    } catch (error) {
      console.error('Gagal menghapus user:', error);
      setErrorMsg(error.response?.data?.message || 'Gagal menghapus akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Upper Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Akun User</h1>
          <p className="text-sm font-medium text-slate-500">Kelola informasi pelanggan, tambahkan akun admin/user baru, edit profil, atau hapus pengguna.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition shadow-md shadow-emerald-500/15 active:scale-95"
        >
          <UserPlus className="h-5 w-5" />
          Tambah Pengguna Baru
        </button>
      </div>

      {/* Search and control widgets */}
      <div className="flex bg-white p-4 border border-slate-200 rounded-xl shadow-sm justify-between items-center gap-4">
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="h-5 w-5" />
          </span>
          <input
            type="text"
            placeholder="Cari user berdasarkan nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-sm font-semibold transition-all"
          />
        </div>

        <div className="text-xs font-bold text-slate-400 bg-slate-50 border px-3 py-1.5 rounded-lg">
          Total Pelanggan: <span className="text-slate-700 font-extrabold">{users.length}</span>
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="mt-4 text-sm text-slate-500 font-semibold">Memuat Data Pengguna...</span>
        </div>
      ) : (
        <Table 
          headers={['ID User', 'Nama Lengkap', 'Alamat Email', 'Role Akses', 'Tanggal Terdaftar', 'Aksi']}
          emptyMessage="Tidak ada pengguna yang cocok dengan pencarian Anda."
        >
          {filteredUsers.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 font-bold text-slate-400 text-xs">#{user.id}</td>
              <td className="px-6 py-4 font-extrabold text-slate-800 text-sm">{user.name}</td>
              <td className="px-6 py-4 text-slate-600 text-sm font-semibold">{user.email}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                  user.role === 'admin' 
                    ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                    : 'bg-blue-50 text-blue-600 border border-blue-100'
                }`}>
                  {user.role === 'admin' ? 'Administrator' : 'Mobile User'}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(user.createdAt)}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {/* Edit button */}
                  <button
                    onClick={() => handleOpenEdit(user)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-500 text-blue-600 hover:text-white border border-blue-200 hover:border-blue-500 font-bold text-xs rounded-lg transition-all"
                    title="Ubah Profil"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>

                  {/* Delete button (Prevent delete self) */}
                  {user.id !== currentAdmin?.id ? (
                    <button
                      onClick={() => handleOpenDelete(user)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-500 font-bold text-xs rounded-lg transition-all"
                      title="Hapus Akun"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic px-2 font-bold">Anda</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* --- MODAL 2: TAMBAH & EDIT USER --- */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-scaleUp">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-500" />
                {isEditMode ? 'Edit Profil Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {successMsg ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-700 flex flex-col items-center justify-center text-center py-6 space-y-2">
                  <div className="bg-emerald-500 text-white p-2.5 rounded-full shadow-lg shadow-emerald-500/20"><Check className="h-6 w-6 stroke-[3]" /></div>
                  <h4 className="font-extrabold text-slate-800 text-base">Berhasil!</h4>
                  <p className="text-xs font-semibold text-slate-500">{successMsg}</p>
                </div>
              ) : (
                <>
                  {errorMsg && (
                    <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-600 flex items-center gap-2 text-xs font-bold">
                      <AlertTriangle className="h-4 w-4 shrink-0" /> {errorMsg}
                    </div>
                  )}

                  {/* Input Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><User className="h-4 w-4" /></span>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Contoh: Andi Pratama"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-semibold text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Input Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Mail className="h-4 w-4" /></span>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="andi@gmail.com"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-semibold text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Input Password (Optional for Edit) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Password {isEditMode && '(Kosongkan jika tidak diubah)'}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Lock className="h-4 w-4" /></span>
                      <input
                        type="password"
                        required={!isEditMode}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-semibold text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Input Role */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Role Akses</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-slate-800 font-bold text-sm focus:outline-none"
                    >
                      <option value="user">Mobile User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setShowFormModal(false)} className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 font-bold text-sm text-slate-600 rounded-xl transition">Batal</button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-bold text-sm text-white rounded-xl shadow-lg disabled:opacity-50 transition flex items-center justify-center gap-1.5">
                      {isSubmitting ? <Loader className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 stroke-[3]" />Simpan</>}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: CONFIRM DELETE USER --- */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-scaleUp">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Konfirmasi Hapus Akun
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {successMsg ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-700 flex flex-col items-center justify-center text-center py-6 space-y-2">
                  <div className="bg-emerald-500 text-white p-2.5 rounded-full shadow-lg shadow-emerald-500/20"><Check className="h-6 w-6 stroke-[3]" /></div>
                  <h4 className="font-extrabold text-slate-800 text-base">Terhapus!</h4>
                  <p className="text-xs font-semibold text-slate-500">{successMsg}</p>
                </div>
              ) : (
                <>
                  {errorMsg && (
                    <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-600 flex items-center gap-2 text-xs font-bold">
                      <AlertTriangle className="h-4 w-4 shrink-0" /> {errorMsg}
                    </div>
                  )}

                  <div className="text-slate-600 text-sm font-semibold space-y-2">
                    <p>Apakah Anda yakin ingin menghapus akun pengguna berikut secara permanen dari sistem SPBKLU?</p>
                    <div className="bg-rose-50/50 p-4 border border-rose-100 rounded-xl text-slate-700 space-y-0.5">
                      <div className="text-xs text-slate-400 font-bold">NAMA PELANGGAN</div>
                      <div className="font-extrabold text-slate-800">{selectedUser.name}</div>
                      <div className="text-xs text-slate-500 font-bold">{selectedUser.email}</div>
                    </div>
                    <p className="text-[11px] text-rose-500 font-extrabold flex items-start gap-1 pt-1">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>Tindakan ini tidak dapat dibatalkan. Menghapus akun juga akan memutus kaitan baterai sewaan yang sedang dibawa oleh pengguna ini.</span>
                    </p>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button type="button" onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 font-bold text-sm text-slate-600 rounded-xl transition">Batal</button>
                    <button type="button" onClick={handleDeleteSubmit} disabled={isSubmitting} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 font-bold text-sm text-white rounded-xl shadow-lg disabled:opacity-50 transition flex items-center justify-center gap-1.5">
                      {isSubmitting ? <Loader className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4" />Hapus Akun</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
