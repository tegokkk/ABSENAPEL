import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, BookOpen, GraduationCap, Users } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Table, { EmptyRow } from '../ui/Table';
import { masterDataApi } from '../../services/masterDataApi';
import { useButtonGuard } from '../../hooks/useDebounce';
import { ConfirmDialog, ToastViewport } from '../ui/Feedback';
import { useConfirmDialog, useToasts } from '../../hooks/useUiFeedback';

const SUB_TABS = ['Jurusan', 'Prodi', 'Kelas'];

export default function TabMasterData() {
  const [activeSubTab, setActiveSubTab] = useState('Jurusan');
  const [dataJurusan, setDataJurusan] = useState([]);
  const [dataProdi, setDataProdi] = useState([]);
  const [dataKelas, setDataKelas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formJurusan, setFormJurusan] = useState({ nama: '', singkatan: '' });
  const [formProdi, setFormProdi] = useState({ nama: '', jurusanId: '' });
  const [formKelas, setFormKelas] = useState({ nama_kelas: '', programStudiId: '' });
  const [, guardAction] = useButtonGuard(1200);
  const { toasts, notify, dismissToast } = useToasts();
  const { dialog, requestConfirm, closeConfirm } = useConfirmDialog();

  const showMessage = useCallback((text) => {
    setMessage(text);
    setError('');
    notify({ type: 'success', title: 'Berhasil', message: text });
    setTimeout(() => setMessage(''), 3000);
  }, [notify]);

  const showError = useCallback((err, fallback) => {
    const messageText = err?.response?.data?.error || fallback;
    setError(messageText);
    setMessage('');
    notify({ type: 'error', title: 'Gagal', message: messageText });
  }, [notify]);

  const fetchData = useCallback(async () => {
    try {
      if (activeSubTab === 'Jurusan') {
        setDataJurusan(await masterDataApi.getJurusan());
      } else if (activeSubTab === 'Prodi') {
        setDataProdi(await masterDataApi.getProgramStudi());
        setDataJurusan(await masterDataApi.getJurusan());
      } else if (activeSubTab === 'Kelas') {
        setDataKelas(await masterDataApi.getKelas());
        setDataProdi(await masterDataApi.getProgramStudi());
      }
    } catch (error) {
      console.error(error);
      showError(error, 'Gagal memuat data akademik');
    }
  }, [activeSubTab, showError]);

  useEffect(() => {
    setError('');
    setMessage('');
    fetchData();
  }, [fetchData]);

  const handleAddJurusan = guardAction(async () => {
    if (!formJurusan.nama.trim()) {
      setError('Nama jurusan wajib diisi');
      return;
    }
    try {
      setLoading(true);
      await masterDataApi.createJurusan(formJurusan);
      setFormJurusan({ nama: '', singkatan: '' });
      showMessage('Jurusan berhasil ditambahkan');
      fetchData();
    } catch (err) {
      showError(err, 'Gagal menambah jurusan');
    } finally { setLoading(false); }
  });
  const handleDeleteJurusan = guardAction(async (id) => {
    const confirmed = await requestConfirm({
      title: 'Hapus jurusan?',
      description: 'Data jurusan ini akan dihapus dari master akademik.',
      confirmLabel: 'Hapus',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await masterDataApi.deleteJurusan(id);
      showMessage('Jurusan berhasil dihapus');
      fetchData();
    } catch (err) {
      showError(err, 'Gagal hapus jurusan');
    }
  });

  const handleAddProdi = guardAction(async () => {
    if (!formProdi.jurusanId || !formProdi.nama.trim()) {
      setError('Jurusan dan nama prodi wajib diisi');
      return;
    }
    try {
      setLoading(true);
      await masterDataApi.createProgramStudi(formProdi);
      setFormProdi({ nama: '', jurusanId: '' });
      showMessage('Program studi berhasil ditambahkan');
      fetchData();
    } catch (err) {
      showError(err, 'Gagal menambah prodi');
    } finally { setLoading(false); }
  });
  const handleDeleteProdi = guardAction(async (id) => {
    const confirmed = await requestConfirm({
      title: 'Hapus program studi?',
      description: 'Data program studi ini akan dihapus dari master akademik.',
      confirmLabel: 'Hapus',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await masterDataApi.deleteProgramStudi(id);
      showMessage('Program studi berhasil dihapus');
      fetchData();
    } catch (err) {
      showError(err, 'Gagal hapus prodi');
    }
  });

  const handleAddKelas = guardAction(async () => {
    if (!formKelas.programStudiId || !formKelas.nama_kelas.trim()) {
      setError('Prodi dan nama kelas wajib diisi');
      return;
    }
    try {
      setLoading(true);
      await masterDataApi.createKelas(formKelas);
      setFormKelas({ nama_kelas: '', programStudiId: '' });
      showMessage('Kelas berhasil ditambahkan');
      fetchData();
    } catch (err) {
      showError(err, 'Gagal menambah kelas');
    } finally { setLoading(false); }
  });
  const handleDeleteKelas = guardAction(async (id) => {
    const confirmed = await requestConfirm({
      title: 'Hapus kelas?',
      description: 'Data kelas ini akan dihapus dari master akademik.',
      confirmLabel: 'Hapus',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await masterDataApi.deleteKelas(id);
      showMessage('Kelas berhasil dihapus');
      fetchData();
    } catch (err) {
      showError(err, 'Gagal hapus kelas');
    }
  });

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {SUB_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`tab-pill whitespace-nowrap ${activeSubTab === tab ? 'active' : ''}`}
            >
              {tab === 'Jurusan' && <BookOpen size={14} />}
              {tab === 'Prodi' && <GraduationCap size={14} />}
              {tab === 'Kelas' && <Users size={14} />}
              {tab}
            </button>
          ))}
        </div>
      </Card>

      {message && (
        <div className="p-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
          {message}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
          {error}
        </div>
      )}

      {activeSubTab === 'Jurusan' && (
        <Card>
          <CardHeader title="Manajemen Jurusan" />
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                label="Nama Jurusan"
                value={formJurusan.nama}
                onChange={(e) => setFormJurusan({ ...formJurusan, nama: e.target.value })}
                placeholder="Contoh: Teknologi Informasi"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <Input
                label="Singkatan"
                value={formJurusan.singkatan}
                onChange={(e) => setFormJurusan({ ...formJurusan, singkatan: e.target.value })}
                placeholder="Contoh: TI"
              />
            </div>
            <Button variant="success" loading={loading} onClick={handleAddJurusan}>
              <Plus size={16} /> Tambah
            </Button>
          </div>
          <Table
            headers={[
              { label: 'Nama' },
              { label: 'Singkatan' },
              { label: 'Aksi', align: 'right' },
            ]}
          >
            {dataJurusan.map((j) => (
              <tr key={j.id}>
                <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{j.nama}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{j.singkatan}</td>
                <td className="text-right">
                  <Button variant="danger" size="sm" onClick={() => handleDeleteJurusan(j.id)}>
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
            {dataJurusan.length === 0 && <EmptyRow colSpan={3} />}
          </Table>
        </Card>
      )}

      {activeSubTab === 'Prodi' && (
        <Card>
          <CardHeader title="Manajemen Program Studi" />
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Select
                label="Pilih Jurusan"
                value={formProdi.jurusanId}
                onChange={(e) => setFormProdi({ ...formProdi, jurusanId: e.target.value })}
              >
                <option value="">-- Pilih Jurusan --</option>
                {dataJurusan.map((j) => (
                  <option key={j.id} value={j.id}>{j.nama}</option>
                ))}
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Input
                label="Nama Prodi"
                value={formProdi.nama}
                onChange={(e) => setFormProdi({ ...formProdi, nama: e.target.value })}
                placeholder="Contoh: Manajemen Informatika"
              />
            </div>
            <Button variant="success" loading={loading} onClick={handleAddProdi}>
              <Plus size={16} /> Tambah
            </Button>
          </div>
          <Table
            headers={[
              { label: 'Nama Prodi' },
              { label: 'Jurusan' },
              { label: 'Aksi', align: 'right' },
            ]}
          >
            {dataProdi.map((p) => (
              <tr key={p.id}>
                <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.nama}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{p.jurusan?.nama}</td>
                <td className="text-right">
                  <Button variant="danger" size="sm" onClick={() => handleDeleteProdi(p.id)}>
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
            {dataProdi.length === 0 && <EmptyRow colSpan={3} />}
          </Table>
        </Card>
      )}

      {activeSubTab === 'Kelas' && (
        <Card>
          <CardHeader title="Manajemen Kelas" />
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Select
                label="Pilih Prodi"
                value={formKelas.programStudiId}
                onChange={(e) => setFormKelas({ ...formKelas, programStudiId: e.target.value })}
              >
                <option value="">-- Pilih Prodi --</option>
                {dataProdi.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Input
                label="Nama Kelas"
                value={formKelas.nama_kelas}
                onChange={(e) => setFormKelas({ ...formKelas, nama_kelas: e.target.value })}
                placeholder="Contoh: MI 4A"
              />
            </div>
            <Button variant="success" loading={loading} onClick={handleAddKelas}>
              <Plus size={16} /> Tambah
            </Button>
          </div>
          <Table
            headers={[
              { label: 'Nama Kelas' },
              { label: 'Prodi' },
              { label: 'Aksi', align: 'right' },
            ]}
          >
            {dataKelas.map((k) => (
              <tr key={k.id}>
                <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{k.nama_kelas}</td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {k.programStudi?.nama}
                  {k._count?.users > 0 && (
                    <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      ({k._count.users} mahasiswa)
                    </span>
                  )}
                </td>
                <td className="text-right">
                  <Button variant="danger" size="sm" onClick={() => handleDeleteKelas(k.id)}>
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
            {dataKelas.length === 0 && <EmptyRow colSpan={3} />}
          </Table>
        </Card>
      )}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      <ConfirmDialog dialog={dialog} onClose={closeConfirm} />
    </div>
  );
}
