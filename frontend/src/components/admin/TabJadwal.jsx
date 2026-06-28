import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Plus, Trash2, Power, PowerOff } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import Table from '../ui/Table';
import { jadwalApi } from '../../services/jadwalApi';
import { useButtonGuard } from '../../hooks/useDebounce';
import { ActionDropdown, AdminEmptyState, AdminModuleHeader, AdminSkeletonRows } from '../ui/AdminPrimitives';

/**
 * Konversi nilai dari input datetime-local ("YYYY-MM-DDTHH:mm") ke ISO 8601
 * dengan offset timezone WIB (UTC+7), agar backend menyimpan waktu yang benar.
 * Tanpa ini, new Date("YYYY-MM-DDTHH:mm") di Node.js dianggap UTC → maju 7 jam.
 */
function localToISO(datetimeLocalValue) {
  if (!datetimeLocalValue) return datetimeLocalValue;
  // Tambahkan offset +07:00 secara eksplisit
  return datetimeLocalValue + ':00+07:00';
}

/**
 * Format timestamp dari DB (UTC/ISO) ke waktu lokal WIB yang mudah dibaca.
 */
function formatWIB(isoString) {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

export default function TabJadwal({ notify, requestConfirm }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    nama_kegiatan: '',
    waktu_mulai: '',
    batas_terlambat: '',
    waktu_selesai: '',
    deskripsi: '',
    is_active: true,
  });
  const [, guardAction] = useButtonGuard(1200);

  const fetchData = useCallback(async () => {
    setFetching(true);
    try { setData(await jadwalApi.getJadwal()); } catch (error) { console.error(error); }
    finally { setFetching(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = guardAction(async () => {
    try {
      setLoading(true);
      // Konversi ke ISO+07:00 agar backend tidak salah interpretasi timezone
      const payload = {
        ...form,
        waktu_mulai:   localToISO(form.waktu_mulai),
        batas_terlambat: localToISO(form.batas_terlambat) || null,
        waktu_selesai: localToISO(form.waktu_selesai),
      };
      await jadwalApi.createJadwal(payload);
      setForm({ nama_kegiatan: '', waktu_mulai: '', batas_terlambat: '', waktu_selesai: '', deskripsi: '', is_active: true });
      notify({ type: 'success', title: 'Jadwal ditambahkan', message: payload.nama_kegiatan });
      fetchData();
    } catch {
      notify({ type: 'error', title: 'Gagal menambah jadwal', message: 'Periksa kembali waktu dan nama kegiatan.' });
    } finally { setLoading(false); }
  });

  const handleDelete = guardAction(async (id) => {
    const confirmed = await requestConfirm({
      title: 'Hapus jadwal?',
      description: 'Jadwal apel ini akan dihapus dari daftar.',
      confirmLabel: 'Hapus',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await jadwalApi.deleteJadwal(id);
      notify({ type: 'success', title: 'Jadwal dihapus', message: 'Daftar jadwal berhasil diperbarui.' });
      fetchData();
    } catch {
      notify({ type: 'error', title: 'Gagal hapus jadwal', message: 'Coba ulangi beberapa saat lagi.' });
    }
  });

  const handleToggleActive = guardAction(async (jadwal) => {
    try {
      await jadwalApi.updateJadwal(jadwal.id, { is_active: !jadwal.is_active });
      notify({
        type: 'success',
        title: jadwal.is_active ? 'Jadwal dinonaktifkan' : 'Jadwal diaktifkan',
        message: jadwal.nama_kegiatan,
      });
      fetchData();
    } catch {
      notify({ type: 'error', title: 'Gagal update status', message: 'Coba ulangi beberapa saat lagi.' });
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <AdminModuleHeader
          title="Manajemen Jadwal Apel"
          description="Atur waktu buka absen, batas terlambat, dan status jadwal apel aktif."
          icon={CalendarClock}
        />
      </Card>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Nama Kegiatan"
            value={form.nama_kegiatan}
            onChange={(e) => setForm({ ...form, nama_kegiatan: e.target.value })}
            placeholder="Contoh: Apel Pagi"
          />
          <Input
            label="Deskripsi"
            value={form.deskripsi}
            onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
            placeholder="Opsional"
          />
          <Input
            label="Waktu Mulai (Buka Absen)"
            type="datetime-local"
            value={form.waktu_mulai}
            onChange={(e) => setForm({ ...form, waktu_mulai: e.target.value })}
          />
          <Input
            label="Batas Terlambat (Opsional)"
            type="datetime-local"
            value={form.batas_terlambat}
            onChange={(e) => setForm({ ...form, batas_terlambat: e.target.value })}
            helperText="Jika kosong, waktu mulai = batas terlambat"
          />
          <Input
            label="Waktu Selesai (Tutup Absen)"
            type="datetime-local"
            value={form.waktu_selesai}
            onChange={(e) => setForm({ ...form, waktu_selesai: e.target.value })}
          />
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="success" loading={loading} onClick={handleAdd}>
            <Plus size={16} /> Tambah Jadwal
          </Button>
        </div>
      </Card>

      <Card>
        <div className="block md:hidden">
          {fetching ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-lg border border-[var(--border-light)] bg-white/[.025] p-4">
                  <div className="skeleton-line mb-3 w-3/4" />
                  <div className="skeleton-line w-1/2" />
                </div>
              ))}
            </div>
          ) : data.length === 0 ? (
            <AdminEmptyState
              icon={CalendarClock}
              title="Belum ada jadwal apel"
              description="Tambahkan jadwal agar mahasiswa mengetahui waktu absensi yang aktif."
            />
          ) : (
            <div className="space-y-3">
              {data.map((j) => {
                const now = new Date();
                const start = new Date(j.waktu_mulai);
                const end = new Date(j.waktu_selesai);
                const isOngoing = j.is_active && now >= start && now <= end;

                return (
                  <div key={j.id} className="rounded-lg border border-[var(--border-light)] bg-white/[.025] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-primary">{j.nama_kegiatan}</p>
                        <p className="mt-1 text-xs text-secondary">{j.deskripsi || '-'}</p>
                      </div>
                      <Badge variant={j.is_active ? 'success' : 'neutral'}>
                        {j.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    {isOngoing && <Badge variant="success" className="mt-3 animate-pulse">SEDANG BERLANGSUNG</Badge>}
                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                      <div className="rounded-lg border border-[var(--border-light)] bg-white/[.025] p-2">
                        <p className="text-muted">Mulai</p>
                        <p className="mt-1 font-mono text-secondary">{formatWIB(j.waktu_mulai)}</p>
                      </div>
                      <div className="rounded-lg border border-[var(--border-light)] bg-white/[.025] p-2">
                        <p className="text-muted">Selesai</p>
                        <p className="mt-1 font-mono text-secondary">{formatWIB(j.waktu_selesai)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <ActionDropdown
                        ariaLabel={`Aksi jadwal ${j.nama_kegiatan}`}
                        items={[
                          {
                            label: j.is_active ? 'Nonaktifkan' : 'Aktifkan',
                            icon: j.is_active ? <PowerOff size={14} /> : <Power size={14} />,
                            tone: j.is_active ? 'dropdown-item-warning' : 'dropdown-item-success',
                            onClick: () => handleToggleActive(j),
                          },
                          {
                            label: 'Hapus',
                            icon: <Trash2 size={14} />,
                            tone: 'dropdown-item-danger',
                            onClick: () => handleDelete(j.id),
                          },
                        ]}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden md:block">
        <Table
          headers={[
            { label: 'Kegiatan' },
            { label: 'Waktu Mulai', width: '21%' },
            { label: 'Batas Terlambat', width: '21%' },
            { label: 'Waktu Selesai', width: '21%' },
            { label: 'Status Aktif', align: 'center', width: '140px' },
            { label: 'Aksi', align: 'center', width: '96px' },
          ]}
        >
          {fetching ? (
            <AdminSkeletonRows rows={4} columns={6} />
          ) : data.map((j) => {
            const now = new Date();
            const start = new Date(j.waktu_mulai);
            const end = new Date(j.waktu_selesai);
            const isOngoing = j.is_active && now >= start && now <= end;

            return (
              <tr key={j.id}>
                <td>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{j.nama_kegiatan}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{j.deskripsi || '-'}</div>
                  {isOngoing && (
                    <Badge variant="success" className="animate-pulse mt-2">
                      SEDANG BERLANGSUNG
                    </Badge>
                  )}
                </td>
                <td className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {formatWIB(j.waktu_mulai)}
                </td>
                <td className="font-mono text-xs text-amber-500/90 font-semibold">
                  {j.batas_terlambat ? formatWIB(j.batas_terlambat) : '-'}
                </td>
                <td className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {formatWIB(j.waktu_selesai)}
                </td>
                <td className="text-center">
                  <Badge variant={j.is_active ? 'success' : 'neutral'}>
                    {j.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </td>
                <td className="text-center action-cell">
                  <ActionDropdown
                    ariaLabel={`Aksi jadwal ${j.nama_kegiatan}`}
                    items={[
                      {
                        label: j.is_active ? 'Nonaktifkan' : 'Aktifkan',
                        icon: j.is_active ? <PowerOff size={14} /> : <Power size={14} />,
                        tone: j.is_active ? 'dropdown-item-warning' : 'dropdown-item-success',
                        onClick: () => handleToggleActive(j),
                      },
                      {
                        label: 'Hapus',
                        icon: <Trash2 size={14} />,
                        tone: 'dropdown-item-danger',
                        onClick: () => handleDelete(j.id),
                      },
                    ]}
                  />
                </td>
              </tr>
            );
          })}
          {!fetching && data.length === 0 && (
            <tr>
              <td colSpan={6}>
                <AdminEmptyState
                  icon={CalendarClock}
                  title="Belum ada jadwal apel"
                  description="Tambahkan jadwal agar mahasiswa mengetahui waktu absensi yang aktif."
                />
              </td>
            </tr>
          )}
        </Table>
        </div>
      </Card>
    </div>
  );
}
