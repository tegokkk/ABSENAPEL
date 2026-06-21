import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Power, PowerOff } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import Table, { EmptyRow } from '../ui/Table';
import { jadwalApi } from '../../services/jadwalApi';
import { useButtonGuard } from '../../hooks/useDebounce';

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

export default function TabJadwal() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nama_kegiatan: '',
    waktu_mulai: '',
    waktu_selesai: '',
    deskripsi: '',
    is_active: true,
  });
  const [, guardAction] = useButtonGuard(1200);

  const fetchData = useCallback(async () => {
    try { setData(await jadwalApi.getJadwal()); } catch (error) { console.error(error); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = guardAction(async () => {
    try {
      setLoading(true);
      // Konversi ke ISO+07:00 agar backend tidak salah interpretasi timezone
      const payload = {
        ...form,
        waktu_mulai:   localToISO(form.waktu_mulai),
        waktu_selesai: localToISO(form.waktu_selesai),
      };
      await jadwalApi.createJadwal(payload);
      setForm({ nama_kegiatan: '', waktu_mulai: '', waktu_selesai: '', deskripsi: '', is_active: true });
      fetchData();
    } catch { alert('Gagal menambah jadwal'); } finally { setLoading(false); }
  });

  const handleDelete = guardAction(async (id) => {
    if (!confirm('Yakin hapus jadwal ini?')) return;
    try { await jadwalApi.deleteJadwal(id); fetchData(); } catch { alert('Gagal hapus'); }
  });

  const handleToggleActive = guardAction(async (jadwal) => {
    try {
      await jadwalApi.updateJadwal(jadwal.id, { is_active: !jadwal.is_active });
      fetchData();
    } catch { alert('Gagal update status'); }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Manajemen Jadwal Apel" />
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
            label="Waktu Mulai"
            type="datetime-local"
            value={form.waktu_mulai}
            onChange={(e) => setForm({ ...form, waktu_mulai: e.target.value })}
          />
          <Input
            label="Waktu Selesai"
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
        <Table
          headers={[
            { label: 'Kegiatan' },
            { label: 'Waktu Mulai' },
            { label: 'Waktu Selesai' },
            { label: 'Status Aktif', align: 'center' },
            { label: 'Aksi', align: 'right' },
          ]}
        >
          {data.map((j) => {
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
                <td className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {formatWIB(j.waktu_selesai)}
                </td>
                <td className="text-center">
                  <Button
                    variant={j.is_active ? 'success' : 'secondary'}
                    size="sm"
                    onClick={() => handleToggleActive(j)}
                  >
                    {j.is_active ? <Power size={14} /> : <PowerOff size={14} />}
                    {j.is_active ? 'Aktif' : 'Nonaktif'}
                  </Button>
                </td>
                <td className="text-right">
                  <Button variant="danger" size="sm" onClick={() => handleDelete(j.id)}>
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            );
          })}
          {data.length === 0 && <EmptyRow colSpan={5} />}
        </Table>
      </Card>
    </div>
  );
}
