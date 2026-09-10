import { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Search, Plus, ChevronLeft, ChevronRight, Trash2, Edit3, KeyRound } from 'lucide-react';
import { usersApi } from '../../services/usersApi';
import { useDebounce, useButtonGuard } from '../../hooks/useDebounce';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Card, { CardHeader } from '../ui/Card';
import Table from '../ui/Table';
import { ActionDropdown, AdminEmptyState, AdminModuleHeader, AdminSkeletonRows } from '../ui/AdminPrimitives';
import { CLASSES } from '../../utils/academic';

export default function TabUsers({ notify, requestConfirm }) {
  const [users, setUsers] = useState([]);
  const [filterKelas, setFilterKelas] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [fetching, setFetching] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', npm: '', kelas: 'MI 4A' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const debouncedFilterKelas = useDebounce(filterKelas, 300);
  const [, guardAction] = useButtonGuard(1500);

  const fetchUsers = useCallback(async (kelas) => {
    setFetching(true);
    try {
      const data = await usersApi.getUsers({ kelas: kelas !== 'Semua Kelas' ? kelas : undefined });
      setUsers(data);
    } catch (error) {
      console.error("Gagal mengambil data mahasiswa:", error);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(debouncedFilterKelas);
    setCurrentPage(1);
  }, [debouncedFilterKelas, fetchUsers]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const lowerQ = searchQuery.toLowerCase();
    return users.filter(u =>
      (u.name && u.name.toLowerCase().includes(lowerQ)) ||
      (u.npm && u.npm.toLowerCase().includes(lowerQ))
    );
  }, [users, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const openAdd = () => {
    setEditUser(null);
    setForm({ name: '', npm: '', kelas: 'MI 4A' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, npm: u.npm || '', kelas: u.kelas || 'MI 4A' });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = guardAction(async () => {
    if (!form.name || !form.npm || !form.kelas) {
      setFormError('Semua field wajib diisi');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      if (editUser) {
        await usersApi.updateUser(editUser.id, form);
        setActionMsg('Data mahasiswa berhasil diperbarui');
        notify({ type: 'success', title: 'Mahasiswa diperbarui', message: form.name });
      } else {
        await usersApi.createUser(form);
        setActionMsg('Mahasiswa berhasil ditambahkan');
        notify({ type: 'success', title: 'Mahasiswa ditambahkan', message: form.name });
      }
      setShowModal(false);
      fetchUsers(debouncedFilterKelas);
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  });

  const handleDelete = guardAction(async (user) => {
    const confirmed = await requestConfirm({
      title: 'Hapus mahasiswa?',
      description: `Mahasiswa "${user.name}" dan seluruh data absensinya akan dihapus.`,
      confirmLabel: 'Hapus',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await usersApi.deleteUser(user.id);
      setActionMsg('Mahasiswa berhasil dihapus');
      notify({ type: 'success', title: 'Mahasiswa dihapus', message: user.name });
      fetchUsers(debouncedFilterKelas);
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      notify({ type: 'error', title: 'Gagal menghapus', message: err.response?.data?.error || 'Coba ulangi beberapa saat lagi.' });
    }
  });

  const handleResetPassword = guardAction(async (user) => {
    const confirmed = await requestConfirm({
      title: 'Reset password?',
      description: `Password "${user.name}" akan dikembalikan ke NPM (${user.npm}).`,
      confirmLabel: 'Reset',
      variant: 'warning',
    });
    if (!confirmed) return;
    try {
      const data = await usersApi.resetPassword(user.id);
      setActionMsg(data.message);
      notify({ type: 'success', title: 'Password direset', message: data.message });
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      notify({ type: 'error', title: 'Gagal reset password', message: err.response?.data?.error || 'Coba ulangi beberapa saat lagi.' });
    }
  });

  const userHeaders = [
    { label: 'No', width: '72px' },
    { label: 'Nama Mahasiswa' },
    { label: 'NPM', width: '18%' },
    { label: 'Kelas', width: '14%' },
    { label: 'Aksi', width: '120px' },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <AdminModuleHeader
          title="Manajemen Mahasiswa"
          description="Kelola akun mahasiswa, kelas, dan reset password default NPM."
          icon={Users}
          action={
            <Button variant="primary" size="md" onClick={openAdd} className="w-full justify-center sm:w-auto">
              <Plus size={15} />
              Tambah Mahasiswa
            </Button>
          }
        />
      </Card>

      <Card className="p-4">
        <div className="admin-toolbar">
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
            <Select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="w-full md:w-48"
            >
              <option value="">Semua Kelas</option>
              {CLASSES.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </Select>

            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Cari nama atau NPM..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 text-sm transition-all rounded-lg"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--border-focus)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </div>
          </div>
        </div>
      </Card>

      {actionMsg && (
        <div className="p-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
          {actionMsg}
        </div>
      )}

      <Card>
        <CardHeader
          title={(
            <>
              Total: <span className="text-accent-400">{filteredUsers.length}</span> mahasiswa ditemukan
            </>
          )}
        />

        <div className="block md:hidden">
          {fetching ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-lg border border-[var(--border-light)] bg-white/[.025] p-4">
                  <div className="skeleton-line mb-3 w-2/3" />
                  <div className="skeleton-line w-1/3" />
                </div>
              ))}
            </div>
          ) : currentData.length === 0 ? (
            <AdminEmptyState
              icon={Users}
              title="Data mahasiswa tidak ditemukan"
              description="Coba ubah filter kelas atau kata kunci pencarian."
            />
          ) : (
            <div className="divide-y divide-white/5">
              {currentData.map((u) => (
                <div key={u.id} className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{u.name}</div>
                      <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-secondary)' }}>{u.npm || '-'}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}>
                      {u.kelas || '-'}
                    </span>
                  </div>
                  <div className="flex justify-end pt-2">
                    <ActionDropdown
                      ariaLabel={`Aksi mahasiswa ${u.name}`}
                      items={[
                        { label: 'Edit', icon: <Edit3 size={14} />, tone: 'dropdown-item-info', onClick: () => openEdit(u) },
                        { label: 'Reset password', icon: <KeyRound size={14} />, tone: 'dropdown-item-warning', onClick: () => handleResetPassword(u) },
                        { label: 'Hapus', icon: <Trash2 size={14} />, tone: 'dropdown-item-danger', onClick: () => handleDelete(u) },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:block">
          <Table headers={userHeaders}>
            {fetching ? (
              <AdminSkeletonRows rows={5} columns={userHeaders.length} />
            ) : currentData.length === 0 ? (
              <tr>
                <td colSpan={userHeaders.length}>
                  <AdminEmptyState
                    icon={Users}
                    title="Data mahasiswa tidak ditemukan"
                    description="Coba ubah filter kelas atau kata kunci pencarian."
                  />
                </td>
              </tr>
            ) : currentData.map((u, i) => (
              <tr key={u.id}>
                <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                <td className="px-5 py-4">
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{u.name}</div>
                </td>
                <td className="px-5 py-4 font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{u.npm || '-'}</td>
                <td className="px-5 py-4">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}>
                    {u.kelas || '-'}
                  </span>
                </td>
                <td className="px-5 py-4 action-cell">
                  <ActionDropdown
                    ariaLabel={`Aksi mahasiswa ${u.name}`}
                    items={[
                      { label: 'Edit', icon: <Edit3 size={14} />, tone: 'dropdown-item-info', onClick: () => openEdit(u) },
                      { label: 'Reset password', icon: <KeyRound size={14} />, tone: 'dropdown-item-warning', onClick: () => handleResetPassword(u) },
                      { label: 'Hapus', icon: <Trash2 size={14} />, tone: 'dropdown-item-danger', onClick: () => handleDelete(u) },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-base)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Halaman <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{currentPage}</span> dari <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{totalPages}</span>
            </span>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={14} />
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal open={showModal} title={editUser ? 'Edit Mahasiswa' : 'Tambah Mahasiswa Baru'} onClose={() => setShowModal(false)}>
        <div className="space-y-4">
          <Input
            label="Nama Lengkap"
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Masukkan nama lengkap"
          />
          <Input
            label="NPM"
            type="text"
            value={form.npm}
            onChange={e => setForm({ ...form, npm: e.target.value })}
            placeholder="Contoh: 24781001"
            helperText="NPM juga digunakan sebagai password login mahasiswa"
          />
          <Select label="Kelas" value={form.kelas} onChange={e => setForm({ ...form, kelas: e.target.value })}>
            {CLASSES.map(k => <option key={k} value={k}>{k}</option>)}
          </Select>
          {formError && <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>{formError}</div>}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" size="md" onClick={() => setShowModal(false)} className="flex-1">Batal</Button>
            <Button variant="primary" size="md" onClick={handleSubmit} loading={formLoading} className="flex-1">
              {editUser ? 'Simpan Perubahan' : 'Tambah Mahasiswa'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
