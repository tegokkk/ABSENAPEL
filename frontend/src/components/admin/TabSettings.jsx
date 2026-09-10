import { useState, useEffect, useCallback } from 'react';
import { Clock, Settings2, Plus, Trash2, Edit3, Power } from 'lucide-react';
import { lokasiApi } from '../../services/lokasiApi';
import { useButtonGuard } from '../../hooks/useDebounce';
import TabJadwal from '../admin/TabJadwal';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { ActionDropdown, AdminModuleHeader } from '../ui/AdminPrimitives';

export default function TabSettings({ notify, requestConfirm }) {
  const [activeSubTab, setActiveSubTab] = useState('umum'); // 'umum' atau 'jadwal'

  const [locations, setLocations] = useState([]);
  const [activeLocationId, setActiveLocationId] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nama_lokasi: '', latitude: '', longitude: '', radius_meter: '100' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [, guardAction] = useButtonGuard(1000);

  const fetchData = useCallback(async () => {
    try {
      const lokasiRes = await lokasiApi.getLokasi();
      setLocations(lokasiRes);
      const activeLoc = lokasiRes.find(l => l.is_active);
      if (activeLoc) setActiveLocationId(activeLoc.id);
    } catch (error) {
      console.error("Gagal mengambil data lokasi:", error);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleActivate = guardAction(async (id) => {
    try {
      await lokasiApi.activateLokasi(id);
      setMsg('Lokasi berhasil diaktifkan');
      notify({ type: 'success', title: 'Lokasi aktif', message: 'Titik apel aktif berhasil diperbarui.' });
      setTimeout(() => setMsg(''), 3000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengaktifkan lokasi');
      notify({ type: 'error', title: 'Gagal mengaktifkan lokasi', message: err.response?.data?.error || 'Coba ulangi beberapa saat lagi.' });
    }
  });

  const openAddForm = () => {
    setEditId(null);
    setForm({ nama_lokasi: '', latitude: '', longitude: '', radius_meter: '100' });
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (loc) => {
    setEditId(loc.id);
    setForm({
      nama_lokasi: loc.nama_lokasi,
      latitude: String(loc.latitude),
      longitude: String(loc.longitude),
      radius_meter: String(loc.radius_meter),
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmitLocation = guardAction(async () => {
    if (!form.nama_lokasi || !form.latitude || !form.longitude) {
      setFormError('Nama lokasi, latitude, dan longitude wajib diisi');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      if (editId) {
        await lokasiApi.updateLokasi(editId, form);
        setMsg('Lokasi berhasil diperbarui');
        notify({ type: 'success', title: 'Lokasi diperbarui', message: form.nama_lokasi });
      } else {
        await lokasiApi.createLokasi(form);
        setMsg('Lokasi berhasil ditambahkan');
        notify({ type: 'success', title: 'Lokasi ditambahkan', message: form.nama_lokasi });
      }
      setShowForm(false);
      setTimeout(() => setMsg(''), 3000);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Gagal menyimpan lokasi');
      notify({ type: 'error', title: 'Gagal menyimpan lokasi', message: err.response?.data?.error || 'Coba ulangi beberapa saat lagi.' });
    } finally {
      setFormLoading(false);
    }
  });

  const handleDeleteLocation = guardAction(async (loc) => {
    if (loc.is_default) {
      setError('Lokasi default tidak dapat dihapus');
      notify({ type: 'error', title: 'Lokasi default', message: 'Lokasi default tidak dapat dihapus.' });
      setTimeout(() => setError(''), 3000);
      return;
    }
    const confirmed = await requestConfirm({
      title: 'Hapus lokasi?',
      description: `Lokasi "${loc.nama_lokasi}" akan dihapus dari daftar titik apel.`,
      confirmLabel: 'Hapus',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await lokasiApi.deleteLokasi(loc.id);
      setMsg('Lokasi berhasil dihapus');
      notify({ type: 'success', title: 'Lokasi dihapus', message: loc.nama_lokasi });
      setTimeout(() => setMsg(''), 3000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menghapus lokasi');
      notify({ type: 'error', title: 'Gagal menghapus lokasi', message: err.response?.data?.error || 'Coba ulangi beberapa saat lagi.' });
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <AdminModuleHeader
          title="Pengaturan Sistem"
          description="Atur titik lokasi apel, radius validasi, dan jadwal aktif yang dipakai mahasiswa."
          icon={Settings2}
        />
      </Card>

      <div className="-mx-3 overflow-x-auto px-3 pb-2 hide-scrollbar sm:mx-0 sm:px-0">
        <nav className="flex min-w-max gap-2">
          <button onClick={() => setActiveSubTab('umum')} className={`tab-pill ${activeSubTab === 'umum' ? 'active' : ''}`}>
             <Settings2 size={16} /> Umum
          </button>
          <button onClick={() => setActiveSubTab('jadwal')} className={`tab-pill ${activeSubTab === 'jadwal' ? 'active' : ''}`}>
             <Clock size={16} /> Jadwal Apel
          </button>
        </nav>
      </div>

      {activeSubTab === 'umum' ? (
        <div className="max-w-3xl space-y-6">
          <Card className="p-6">
            <div className="admin-module-header mb-4">
          <div>
            <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Lokasi Titik Apel Aktif</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Pilih lokasi yang digunakan saat mahasiswa melakukan absen apel.</p>
          </div>
          <Button variant="primary" size="sm" onClick={openAddForm}>
            <Plus size={14} />
            Tambah Lokasi
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {locations.length === 0 ? (
            <div className="p-6 text-center text-sm rounded-xl" style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}>
              Belum ada lokasi. Silakan tambah lokasi baru.
            </div>
          ) : (
            locations.map(loc => {
              const isActive = loc.id === activeLocationId;
              return (
                <div
                  key={loc.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'shadow-sm'
                      : 'hover:border-[rgba(255,255,255,0.15)]'
                  }`}
                  style={{
                    background: isActive ? 'var(--accent-dim)' : 'var(--bg-base)',
                    borderColor: isActive ? 'rgba(16,185,129,0.3)' : 'var(--border)'
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{loc.nama_lokasi}</h4>
                        {isActive && (
                          <Badge variant="success" className="text-[10px]">AKTIF</Badge>
                        )}
                        {loc.is_default && (
                          <Badge variant="warning" className="text-[10px]">DEFAULT</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                        <span>Lat: {loc.latitude}</span>
                        <span>Lng: {loc.longitude}</span>
                        <span>Radius: {loc.radius_meter}m</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <ActionDropdown
                        ariaLabel={`Aksi lokasi ${loc.nama_lokasi}`}
                        items={[
                          !isActive && {
                            label: 'Aktifkan',
                            icon: <Power size={14} />,
                            tone: 'dropdown-item-success',
                            onClick: () => handleActivate(loc.id),
                          },
                          {
                            label: 'Edit',
                            icon: <Edit3 size={14} />,
                            tone: 'dropdown-item-info',
                            onClick: () => openEditForm(loc),
                          },
                          !loc.is_default && {
                            label: 'Hapus',
                            icon: <Trash2 size={14} />,
                            tone: 'dropdown-item-danger',
                            onClick: () => handleDeleteLocation(loc),
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Modal open={showForm} title={editId ? 'Edit Lokasi' : 'Tambah Lokasi Baru'} onClose={() => setShowForm(false)}>
        <div className="space-y-4">
          <Input
            label="Nama Lokasi"
            type="text"
            value={form.nama_lokasi}
            onChange={e => setForm({ ...form, nama_lokasi: e.target.value })}
            placeholder="Contoh: Lapangan GSG Polinela"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Latitude"
              type="number"
              step="any"
              value={form.latitude}
              onChange={e => setForm({ ...form, latitude: e.target.value })}
              placeholder="-5.3569503"
              className="font-mono"
            />
            <Input
              label="Longitude"
              type="number"
              step="any"
              value={form.longitude}
              onChange={e => setForm({ ...form, longitude: e.target.value })}
              placeholder="105.2317229"
              className="font-mono"
            />
          </div>
          <Input
            label="Radius Absen (meter)"
            type="number"
            min="10"
            max="5000"
            value={form.radius_meter}
            onChange={e => setForm({ ...form, radius_meter: e.target.value })}
            className="font-mono"
            helperText="Jarak maksimal mahasiswa dari titik ini agar absen diterima."
          />
          {formError && <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>{formError}</div>}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" size="md" onClick={() => setShowForm(false)} className="flex-1">Batal</Button>
            <Button variant="primary" size="md" onClick={handleSubmitLocation} loading={formLoading} className="flex-1">
              {editId ? 'Simpan Perubahan' : 'Tambah Lokasi'}
            </Button>
          </div>
        </div>
      </Modal>

      {msg && <div className="p-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>{msg}</div>}
      {error && <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>{error}</div>}

      <div className="p-4 rounded-2xl" style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)' }}>
        <p className="text-sm font-medium" style={{ color: '#38bdf8' }}>Catatan Penting</p>
        <p className="text-xs mt-1" style={{ color: 'rgba(56,189,248,0.8)' }}>
          Lokasi aktif akan digunakan saat mahasiswa melakukan absen apel. Radius absen setiap lokasi bisa berbeda.
          Gunakan Google Maps untuk mendapatkan koordinat yang tepat. Lokasi default tidak dapat dihapus.
        </p>
      </div>
        </div>
      ) : (
        <TabJadwal notify={notify} requestConfirm={requestConfirm} />
      )}
    </div>
  );
}
