import { useCallback, useEffect, useState } from 'react';
import { Check, X as XIcon, Eye } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import Table, { EmptyRow } from '../ui/Table';
import { izinApi } from '../../services/izinApi';
import { useButtonGuard } from '../../hooks/useDebounce';

const STATUS_MAP = {
  APPROVED: { variant: 'success', label: 'APPROVED' },
  REJECTED: { variant: 'danger', label: 'REJECTED' },
  PENDING: { variant: 'warning', label: 'PENDING' },
};

export default function TabIzin() {
  const [data, setData] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [, guardAction] = useButtonGuard(1200);

  const fetchData = useCallback(async () => {
    try { setData(await izinApi.getIzins()); } catch (error) { console.error(error); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdateStatus = guardAction(async (id, status) => {
    if (!confirm(`Yakin ingin mengubah status menjadi ${status}?`)) return;
    try {
      await izinApi.updateStatus(id, status);
      fetchData();
    } catch (e) {
      const msg = e.response?.data?.error || e.response?.data?.message || e.message || 'Gagal update status';
      alert(`Gagal update status: ${msg}`);
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Validasi Pengajuan Izin" />
        <Table
          headers={[
            { label: 'Mahasiswa' },
            { label: 'Tanggal Izin' },
            { label: 'Jenis & Keterangan' },
            { label: 'Lampiran' },
            { label: 'Status', align: 'center' },
            { label: 'Aksi', align: 'right' },
          ]}
        >
          {data.map((i) => {
            const statusInfo = STATUS_MAP[i.status] || STATUS_MAP.PENDING;
            return (
              <tr key={i.id}>
                <td>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{i.user?.name}</div>
                  <div className="flex gap-2 items-center mt-1">
                    <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{i.user?.npm || '-'}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}>
                      {i.user?.kelas || '-'}
                    </span>
                  </div>
                </td>
                <td className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(i.tanggal_awal).toLocaleDateString('id-ID')} - {new Date(i.tanggal_akhir).toLocaleDateString('id-ID')}
                </td>
                <td>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{i.jenis_izin}</span>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{i.keterangan}</p>
                </td>
                <td>
                  {i.lampiran_url ? (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedImage(i.lampiran_url)} style={{ color: '#38bdf8' }}>
                      <Eye size={14} /> Lihat
                    </Button>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Tidak ada</span>
                  )}
                </td>
                <td className="text-center">
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </td>
                <td className="text-right space-x-2">
                  {i.status === 'PENDING' && (
                    <>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleUpdateStatus(i.id, 'APPROVED')}
                      >
                        <Check size={14} /> Setuju
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleUpdateStatus(i.id, 'REJECTED')}
                      >
                        <XIcon size={14} /> Tolak
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {data.length === 0 && <EmptyRow colSpan={6} message="Belum ada pengajuan izin" />}
        </Table>
      </Card>

      <Modal
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        title="Lampiran Izin"
        size="xl"
      >
        {selectedImage && (
          <div className="flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Lampiran Izin"
              className="max-h-[70vh] max-w-full rounded-lg object-contain"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
