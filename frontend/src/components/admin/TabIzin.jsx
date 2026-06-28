import { useCallback, useEffect, useState } from 'react';
import { Check, Eye, FileText, Trash2, X as XIcon } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import Table from '../ui/Table';
import { izinApi } from '../../services/izinApi';
import { useButtonGuard } from '../../hooks/useDebounce';
import { ActionDropdown, AdminEmptyState, AdminModuleHeader, AdminSkeletonRows } from '../ui/AdminPrimitives';

const STATUS_MAP = {
  APPROVED: { variant: 'success', label: 'Disetujui' },
  REJECTED: { variant: 'danger', label: 'Ditolak' },
  PENDING: { variant: 'warning', label: 'Menunggu' },
};

export default function TabIzin({ notify, requestConfirm }) {
  const [data, setData] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, guardAction] = useButtonGuard(1200);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { setData(await izinApi.getIzins()); } catch (error) { console.error(error); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdateStatus = guardAction(async (id, status) => {
    const confirmed = await requestConfirm({
      title: 'Ubah status izin?',
      description: `Status pengajuan izin akan diubah menjadi ${STATUS_MAP[status]?.label || status}.`,
      confirmLabel: 'Ubah',
      variant: status === 'REJECTED' ? 'danger' : 'success',
    });
    if (!confirmed) return;
    try {
      await izinApi.updateStatus(id, status);
      notify({ type: 'success', title: 'Status izin diperbarui', message: `Status sekarang ${STATUS_MAP[status]?.label || status}.` });
      fetchData();
    } catch (e) {
      const msg = e.response?.data?.error || e.response?.data?.message || e.message || 'Gagal update status';
      notify({ type: 'error', title: 'Gagal update status', message: msg });
    }
  });

  const handleDeleteIzin = guardAction(async (id, namaUser) => {
    const confirmed = await requestConfirm({
      title: 'Hapus data izin?',
      description: `Data izin milik ${namaUser} akan dihapus dan tidak dapat dikembalikan.`,
      confirmLabel: 'Hapus',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await izinApi.deleteIzin(id);
      notify({ type: 'success', title: 'Izin dihapus', message: namaUser });
      fetchData();
    } catch (e) {
      const msg = e.response?.data?.error || e.response?.data?.message || e.message || 'Gagal menghapus izin';
      notify({ type: 'error', title: 'Gagal menghapus izin', message: msg });
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <AdminModuleHeader
          title="Validasi Pengajuan Izin"
          description="Tinjau pengajuan sakit, izin, dan surat tugas mahasiswa dari satu daftar."
          icon={FileText}
        />
      </Card>

      <Card>
        <div className="block md:hidden">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-lg border border-[var(--border-light)] bg-white/[.025] p-4">
                  <div className="skeleton-line mb-3 w-2/3" />
                  <div className="skeleton-line mb-3 w-1/2" />
                  <div className="skeleton-line w-1/3" />
                </div>
              ))}
            </div>
          ) : data.length === 0 ? (
            <AdminEmptyState
              icon={FileText}
              title="Belum ada pengajuan izin"
              description="Pengajuan sakit, izin, atau surat tugas mahasiswa akan muncul di sini untuk divalidasi."
            />
          ) : (
            <div className="space-y-3">
              {data.map((i) => {
                const statusInfo = STATUS_MAP[i.status] || STATUS_MAP.PENDING;
                return (
                  <div key={i.id} className="rounded-lg border border-[var(--border-light)] bg-white/[.025] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-primary">{i.user?.name || '-'}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs font-mono text-secondary">{i.user?.npm || '-'}</span>
                          <span className="rounded border border-info-500/30 bg-info-500/15 px-1.5 py-0.5 text-[10px] font-bold text-info-500">
                            {i.user?.kelas || '-'}
                          </span>
                        </div>
                      </div>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                      <div className="rounded-lg border border-[var(--border-light)] bg-white/[.025] p-2">
                        <p className="text-muted">Tanggal izin</p>
                        <p className="mt-1 font-mono text-secondary">
                          {new Date(i.tanggal_awal).toLocaleDateString('id-ID')} - {new Date(i.tanggal_akhir).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[var(--border-light)] bg-white/[.025] p-2">
                        <p className="text-muted">Jenis dan keterangan</p>
                        <p className="mt-1 font-semibold text-primary">{i.jenis_izin}</p>
                        <p className="mt-1 text-secondary">{i.keterangan}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      {i.lampiran_url ? (
                        <Button variant="ghost" size="sm" onClick={() => setSelectedImage(i.lampiran_url)} style={{ color: '#38bdf8' }}>
                          <Eye size={14} /> Lampiran
                        </Button>
                      ) : (
                        <span className="text-xs text-muted">Tanpa lampiran</span>
                      )}
                      <ActionDropdown
                        ariaLabel={`Aksi pengajuan izin ${i.user?.name || 'mahasiswa'}`}
                        items={[
                          i.status === 'PENDING' && {
                            label: 'Setuju',
                            icon: <Check size={14} />,
                            tone: 'dropdown-item-success',
                            onClick: () => handleUpdateStatus(i.id, 'APPROVED'),
                          },
                          i.status === 'PENDING' && {
                            label: 'Tolak',
                            icon: <XIcon size={14} />,
                            tone: 'dropdown-item-danger',
                            onClick: () => handleUpdateStatus(i.id, 'REJECTED'),
                          },
                          i.status === 'APPROVED' && {
                            label: 'Hapus',
                            icon: <Trash2 size={14} />,
                            tone: 'dropdown-item-danger',
                            onClick: () => handleDeleteIzin(i.id, i.user?.name),
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
          className="izin-table"
          headers={[
            { label: 'Mahasiswa', width: '22%' },
            { label: 'Tanggal Izin', width: '18%' },
            { label: 'Jenis & Keterangan', width: '24%' },
            { label: 'Lampiran', width: '15%' },
            { label: 'Status', width: '12%' },
            { label: 'Aksi', width: '9%' },
          ]}
        >
          {loading ? (
            <AdminSkeletonRows rows={4} columns={6} />
          ) : data.map((i) => {
            const statusInfo = STATUS_MAP[i.status] || STATUS_MAP.PENDING;
            return (
              <tr key={i.id} className="align-top">
                <td className="izin-cell">
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{i.user?.name}</div>
                  <div className="flex gap-2 items-center mt-1">
                    <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{i.user?.npm || '-'}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}>
                      {i.user?.kelas || '-'}
                    </span>
                  </div>
                </td>
                <td className="izin-cell font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(i.tanggal_awal).toLocaleDateString('id-ID')} - {new Date(i.tanggal_akhir).toLocaleDateString('id-ID')}
                </td>
                <td className="izin-cell">
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{i.jenis_izin}</span>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{i.keterangan}</p>
                </td>
                <td className="izin-cell">
                  {i.lampiran_url ? (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedImage(i.lampiran_url)} style={{ color: '#38bdf8' }}>
                      <Eye size={14} /> Lihat
                    </Button>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Tidak ada</span>
                  )}
                </td>
                <td className="izin-cell">
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </td>
                <td className="izin-cell action-cell">
                  <ActionDropdown
                    ariaLabel={`Aksi pengajuan izin ${i.user?.name || 'mahasiswa'}`}
                    items={[
                      i.status === 'PENDING' && {
                        label: 'Setuju',
                        icon: <Check size={14} />,
                        tone: 'dropdown-item-success',
                        onClick: () => handleUpdateStatus(i.id, 'APPROVED'),
                      },
                      i.status === 'PENDING' && {
                        label: 'Tolak',
                        icon: <XIcon size={14} />,
                        tone: 'dropdown-item-danger',
                        onClick: () => handleUpdateStatus(i.id, 'REJECTED'),
                      },
                      i.status === 'APPROVED' && {
                        label: 'Hapus',
                        icon: <Trash2 size={14} />,
                        tone: 'dropdown-item-danger',
                        onClick: () => handleDeleteIzin(i.id, i.user?.name),
                      },
                    ]}
                  />
                </td>
              </tr>
            );
          })}
          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={6}>
                <AdminEmptyState
                  icon={FileText}
                  title="Belum ada pengajuan izin"
                  description="Pengajuan sakit, izin, atau surat tugas mahasiswa akan muncul di sini untuk divalidasi."
                />
              </td>
            </tr>
          )}
        </Table>
        </div>
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
