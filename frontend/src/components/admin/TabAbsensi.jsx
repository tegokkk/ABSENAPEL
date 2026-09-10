import { useState, useEffect, useCallback } from 'react';
import { Calendar, FileText, Download, Navigation, MapPin, Trash2, Eye } from 'lucide-react';
import { attendanceApi } from '../../services/attendanceApi';
import { useDebounce, useButtonGuard } from '../../hooks/useDebounce';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Table from '../ui/Table';
import { ActionDropdown, AdminEmptyState, AdminModuleHeader, AdminSkeletonRows } from '../ui/AdminPrimitives';
import { CLASSES } from '../../utils/academic';
import { formatWibTime } from '../../utils/dateTime';

export default function TabAbsensi({ notify, requestConfirm }) {
  const [attendances, setAttendances] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [loadedKelas, setLoadedKelas] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const debouncedKelas = useDebounce(selectedKelas, 300);
  const [, guardExport] = useButtonGuard(2000);
  const [, guardDeleteAttendance] = useButtonGuard(1200);

  const fetchAttendances = useCallback(async (kelas) => {
    setFetching(true);
    try {
      const data = await attendanceApi.getAttendance({ kelas: kelas !== 'Semua Kelas' ? kelas : undefined });
      setAttendances(data);
      setLoadedKelas(kelas);
    } catch (error) {
      console.error("Gagal mengambil data absensi:", error);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendances(debouncedKelas);
  }, [debouncedKelas, fetchAttendances]);

  const handleDelete = guardDeleteAttendance(async (id) => {
    const confirmed = await requestConfirm({
      title: 'Hapus data absensi?',
      description: 'Data absensi yang dihapus tidak dapat dikembalikan.',
      confirmLabel: 'Hapus',
      variant: 'danger',
    });
    if (!confirmed) return;
    setDeleting(id);
    try {
      await attendanceApi.deleteAttendance(id);
      fetchAttendances(debouncedKelas);
      notify({ type: 'success', title: 'Data dihapus', message: 'Absensi berhasil dihapus dari rekap.' });
    } catch (err) {
      notify({ type: 'error', title: 'Gagal menghapus', message: err.response?.data?.error || 'Coba ulangi beberapa saat lagi.' });
    } finally {
      setDeleting(null);
    }
  });

  const exportReport = (format) => guardExport(async () => {
    setLoading(true);
    try {
      const reports = await import('../../reports/attendanceReport');
      const download = format === 'excel' ? reports.downloadAttendanceExcel : reports.downloadAttendancePdf;
      await download(attendances, selectedKelas);
    } catch {
      notify({ type: 'error', title: 'Export gagal', message: format === 'excel' ? 'Data Excel belum berhasil dibuat.' : 'PDF belum berhasil dibuat.' });
    } finally {
      setLoading(false);
    }
  });
  const exportExcel = exportReport('excel');
  const exportPDF = exportReport('pdf');

  const absensiHeaders = [
    { label: 'No', width: '72px' },
    { label: 'Mahasiswa', width: '25%' },
    { label: 'Waktu', width: '13%' },
    { label: 'Status', width: '12%' },
    { label: 'Jarak', width: '12%' },
    { label: 'Foto', width: '10%' },
    { label: 'Lokasi', width: '14%' },
    { label: 'Aksi', align: 'center', width: '112px' },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <AdminModuleHeader
          title="Data Absensi"
          description="Pantau kehadiran apel, bukti selfie, lokasi, dan export rekap kelas."
          icon={Calendar}
        />
      </Card>

      <Card className="p-4">
        <div className="admin-toolbar">
          <div className="flex items-center w-full md:w-auto">
            <Select
              aria-label="Filter kelas absensi"
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full md:w-64"
            >
              <option value="">Semua Kelas</option>
              {CLASSES.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </Select>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="success"
              size="md"
              onClick={exportExcel}
              disabled={loading || fetching || selectedKelas !== loadedKelas}
              className="flex-1 md:flex-none"
            >
              <Download size={15} />
              Excel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={exportPDF}
              disabled={loading || fetching || selectedKelas !== loadedKelas}
              className="flex-1 md:flex-none"
            >
              <FileText size={15} />
              PDF
            </Button>
          </div>
        </div>
      </Card>

      <div className="block md:hidden">
        {fetching ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="p-4">
                <div className="skeleton-line mb-3 w-2/3" />
                <div className="skeleton-line mb-3 w-1/2" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="skeleton-line w-full" />
                  <div className="skeleton-line w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : attendances.length === 0 ? (
          <Card>
            <AdminEmptyState
              icon={Calendar}
              title="Belum ada data absensi"
              description="Data akan muncul setelah mahasiswa melakukan absensi apel sesuai jadwal."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {attendances.map((a) => (
              <Card key={a.id_absensi} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-primary">{a.user.name}</p>
                    <p className="mt-0.5 text-xs font-mono text-secondary">{a.user.npm || '-'} / {a.user.kelas || '-'}</p>
                  </div>
                  <Badge variant={a.status === 'TERLAMBAT' ? 'warning' : 'success'}>
                    {a.status === 'TERLAMBAT' ? 'Terlambat' : 'Hadir'}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-[var(--border-light)] bg-white/[.025] p-2">
                    <p className="text-muted">Tanggal</p>
                    <p className="mt-1 font-medium text-primary">{new Date(a.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border-light)] bg-white/[.025] p-2">
                    <p className="text-muted">Waktu</p>
                    <p className="mt-1 font-mono text-secondary">{a.jam_absen ? formatWibTime(a.jam_absen) : '-'}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border-light)] bg-white/[.025] p-2">
                    <p className="text-muted">Jarak</p>
                    <p className="mt-1 font-mono text-secondary">{a.jarak_dari_titik != null ? `${a.jarak_dari_titik.toFixed(1)} m` : '-'}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border-light)] bg-white/[.025] p-2">
                    <p className="text-muted">Bukti</p>
                    <button
                      type="button"
                      onClick={() => a.foto_selfie && setSelectedPhoto(a.foto_selfie)}
                      className="mt-1 text-xs font-semibold text-info-500 disabled:text-muted"
                      disabled={!a.foto_selfie}
                    >
                      {a.foto_selfie ? 'Lihat foto' : 'Tidak ada'}
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {a.latitude != null && a.longitude != null ? (
                    <a
                      href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-info-500/20 bg-info-500/10 px-3 text-xs font-semibold text-info-500"
                    >
                      <MapPin size={13} /> Maps
                    </a>
                  ) : (
                    <span className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--border)] text-xs text-muted">Tanpa lokasi</span>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedPhoto(a.foto_selfie)}
                    disabled={!a.foto_selfie}
                  >
                    <Eye size={13} /> Foto
                  </Button>
                  <ActionDropdown
                    ariaLabel={`Aksi absensi ${a.user.name}`}
                    items={[
                      {
                        label: deleting === a.id_absensi ? 'Menghapus...' : 'Hapus',
                        icon: <Trash2 size={14} />,
                        tone: 'dropdown-item-danger',
                        disabled: deleting === a.id_absensi,
                        onClick: () => handleDelete(a.id_absensi),
                      },
                    ]}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="hidden md:block">
      <Table headers={absensiHeaders}>
        {fetching ? (
          <AdminSkeletonRows rows={5} columns={absensiHeaders.length} />
        ) : attendances.length === 0 ? (
          <tr>
            <td colSpan={absensiHeaders.length}>
              <AdminEmptyState
                icon={Calendar}
                title="Belum ada data absensi"
                description="Gunakan filter kelas atau tunggu mahasiswa melakukan absensi apel."
              />
            </td>
          </tr>
        ) : attendances.map((a, i) => (
          <tr key={a.id_absensi}>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
            <td className="px-4 py-3">
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{a.user.name}</div>
              <div className="flex gap-2 items-center mt-1">
                <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{a.user.npm || '-'}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}>
                  {a.user.kelas || '-'}
                </span>
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                {new Date(a.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div className="font-mono text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {a.jam_absen ? formatWibTime(a.jam_absen) : '-'}
              </div>
            </td>
            <td className="px-4 py-3">
              <Badge variant={a.status === 'TERLAMBAT' ? 'warning' : 'success'}>
                {a.status === 'TERLAMBAT' ? 'Terlambat' : 'Hadir'}
              </Badge>
            </td>
            <td className="px-4 py-3">
              {a.jarak_dari_titik != null ? (
                <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-1 rounded-lg" style={{ color: 'var(--text-primary)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
                  <Navigation size={11} />
                  {a.jarak_dari_titik.toFixed(1)} m
                </span>
              ) : (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
              )}
            </td>
            <td className="px-4 py-3">
              {a.foto_selfie ? (
                <img
                  src={a.foto_selfie}
                  alt="Selfie"
                  className="w-10 h-10 rounded-xl object-cover cursor-pointer hover:scale-110 transition-all shadow-sm"
                  style={{ border: '1px solid var(--border)' }}
                  onClick={() => setSelectedPhoto(a.foto_selfie)}
                />
              ) : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}
            </td>
            <td className="px-4 py-3">
              {a.latitude != null && a.longitude != null ? (
                <a
                  href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-all font-medium whitespace-nowrap"
                  style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}
                  title="Buka Google Maps"
                >
                  <MapPin size={12} />
                  Buka Maps
                </a>
              ) : (
                <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Lokasi tidak tersedia</span>
              )}
            </td>
            <td className="px-4 py-3 text-center action-cell">
              <ActionDropdown
                ariaLabel={`Aksi absensi ${a.user.name}`}
                items={[
                  a.foto_selfie && {
                    label: 'Lihat foto',
                    icon: <Eye size={14} />,
                    tone: 'dropdown-item-info',
                    onClick: () => setSelectedPhoto(a.foto_selfie),
                  },
                  {
                    label: deleting === a.id_absensi ? 'Menghapus...' : 'Hapus',
                    icon: <Trash2 size={14} />,
                    tone: 'dropdown-item-danger',
                    disabled: deleting === a.id_absensi,
                    onClick: () => handleDelete(a.id_absensi),
                  },
                ]}
              />
            </td>
          </tr>
        ))}
      </Table>
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setSelectedPhoto(null)}>
          <img src={selectedPhoto} alt="Selfie" className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl" style={{ border: '4px solid #161b22' }} />
        </div>
      )}
    </div>
  );
}
