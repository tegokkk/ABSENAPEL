import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar, FileText, Clock, Users, Settings2,
  Download, Search, Plus, Navigation, MapPin,
  Grid3X3, ChevronLeft, ChevronRight, BarChart3, Activity, ShieldCheck,
  UserX, Trophy, ClipboardList, TrendingUp, Trash2, Edit3, KeyRound, Eye,
  Power
} from 'lucide-react';
import { attendanceApi } from '../services/attendanceApi';
import { usersApi } from '../services/usersApi';
import { lokasiApi } from '../services/lokasiApi';
import { izinApi } from '../services/izinApi';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useDebounce, useButtonGuard } from '../hooks/useDebounce';
import TabJadwal from '../components/admin/TabJadwal';
import TabIzin from '../components/admin/TabIzin';

import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card, { CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';
import { ConfirmDialog, ToastViewport } from '../components/ui/Feedback';
import { useConfirmDialog, useToasts } from '../hooks/useUiFeedback';
import { ActionDropdown, AdminEmptyState, AdminModuleHeader, AdminSkeletonRows } from '../components/ui/AdminPrimitives';

const CLASSES = ['MI 4A', 'MI 4B', 'MI 4C', 'MI 4D'];

function isSameLocalDay(value, targetDate = new Date()) {
  const date = new Date(value);
  return (
    date.getDate() === targetDate.getDate() &&
    date.getMonth() === targetDate.getMonth() &&
    date.getFullYear() === targetDate.getFullYear()
  );
}

function formatShortDate(value) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
  });
}

// ============================================================
// TAB ABSENSI
// ============================================================
function TabAbsensi({ notify, requestConfirm }) {
  const [attendances, setAttendances] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
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

  const exportExcel = guardExport(async () => {
    setLoading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const sheetName = !selectedKelas || selectedKelas === 'Semua Kelas' ? 'Semua Data' : selectedKelas;
      const sheet = workbook.addWorksheet(sheetName);

      sheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Nama Mahasiswa', key: 'nama', width: 30 },
        { header: 'NPM', key: 'npm', width: 15 },
        { header: 'Kelas', key: 'kelas', width: 12 },
        { header: 'Tanggal', key: 'tanggal', width: 15 },
        { header: 'Waktu Absen', key: 'jam_absen', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'IP Address', key: 'ip', width: 15 },
        { header: 'Browser & Platform', key: 'device', width: 25 },
      ];

      sheet.getRow(1).eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      attendances.forEach((a, index) => {
        const row = sheet.addRow({
          no: index + 1,
          nama: a.user.name,
          npm: a.user.npm || '-',
          kelas: a.user.kelas || '-',
          tanggal: new Date(a.tanggal).toLocaleDateString('id-ID'),
          jam_absen: a.jam_absen ? new Date(a.jam_absen).toLocaleTimeString('id-ID') : '-',
          status: a.status,
          ip: a.ip_address || '-',
          device: `${a.browser || '-'} / ${a.platform || '-'}`,
        });
        if (a.status === 'TERLAMBAT') {
          row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          row.getCell('status').font = { color: { argb: 'FFD97706' }, bold: true };
        } else {
          row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
          row.getCell('status').font = { color: { argb: 'FF059669' }, bold: true };
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const fname = !selectedKelas || selectedKelas === 'Semua Kelas' ? 'Semua_Kelas' : selectedKelas.replace(' ', '_');
      anchor.download = `absensi_${fname}_${new Date().toISOString().split('T')[0]}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch {
      notify({ type: 'error', title: 'Export gagal', message: 'Data Excel belum berhasil dibuat.' });
    } finally {
      setLoading(false);
    }
  });

  const exportPDF = guardExport(() => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const filterLabel = !selectedKelas || selectedKelas === 'Semua Kelas' ? 'Semua Kelas' : selectedKelas;
      const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Rekap Absensi Mahasiswa', 148, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Smart Attendance - Manajemen Informatika', 148, 22, { align: 'center' });
      doc.setFontSize(9);
      doc.text(`Kelas: ${filterLabel}  |  Tanggal Cetak: ${today}`, 148, 28, { align: 'center' });

      doc.setDrawColor(2, 132, 199);
      doc.setLineWidth(0.5);
      doc.line(14, 31, 283, 31);

      const tableData = attendances.map((a, i) => [
        i + 1,
        a.user.name,
        a.user.kelas || '-',
        new Date(a.tanggal).toLocaleDateString('id-ID'),
        a.jam_absen ? new Date(a.jam_absen).toLocaleTimeString('id-ID') : '-',
        a.status === 'TERLAMBAT' ? 'Terlambat' : 'Hadir'
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['No', 'Nama Mahasiswa', 'Kelas', 'Tanggal', 'Waktu Absen', 'Status']],
        body: tableData,
        styles: { fontSize: 9, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.1 },
        headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 },
          1: { cellWidth: 80 },
          2: { halign: 'center', cellWidth: 30 },
          3: { halign: 'center', cellWidth: 40 },
          4: { halign: 'center', cellWidth: 40 },
          5: { halign: 'center', cellWidth: 30 },
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            if (data.cell.raw === 'Terlambat') {
              data.cell.styles.textColor = [217, 119, 6];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [5, 150, 105];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        margin: { left: 14, right: 14 },
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Halaman ${i} dari ${pageCount}`, 283, 200, { align: 'right' });
        doc.text(`Dicetak oleh Smart Attendance`, 14, 200);
      }

      const fname = !selectedKelas || selectedKelas === 'Semua Kelas' ? 'Semua_Kelas' : selectedKelas.replace(' ', '_');
      doc.save(`absensi_${fname}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch {
      notify({ type: 'error', title: 'Export gagal', message: 'PDF belum berhasil dibuat.' });
    }
  });

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
              disabled={loading}
              className="flex-1 md:flex-none"
            >
              <Download size={15} />
              Excel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={exportPDF}
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
                    <p className="mt-1 font-mono text-secondary">{a.jam_absen ? new Date(a.jam_absen).toLocaleTimeString('id-ID') : '-'}</p>
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
                {a.jam_absen ? new Date(a.jam_absen).toLocaleTimeString('id-ID') : '-'}
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

// ============================================================
// TAB MANAJEMEN USER
// ============================================================
function TabUsers({ notify, requestConfirm }) {
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

// ============================================================
// TAB PENGATURAN — Lokasi Titik Apel + Pengaturan Waktu
// ============================================================
function TabSettings({ notify, requestConfirm }) {
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

// ============================================================
// ADMIN DASHBOARD UTAMA
// ============================================================
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('absensi');
  const [stats, setStats] = useState({ totalToday: 0, hadir: 0, terlambat: 0, byKelas: {} });
  const [insights, setInsights] = useState({
    belumAbsen: 0,
    izinPending: 0,
    kelasTeraktif: '-',
    trend7Hari: [],
  });
  const { toasts, notify, dismissToast } = useToasts();
  const { dialog, requestConfirm, closeConfirm } = useConfirmDialog();

  const fetchStats = useCallback(async () => {
    try {
      const data = await attendanceApi.getStats();
      setStats(data);
    } catch (error) {
      console.error("Gagal mengambil stats absensi:", error);
    }
  }, []);

  const fetchDashboardInsights = useCallback(async () => {
    try {
      const [attendances, users, izins] = await Promise.all([
        attendanceApi.getAttendance(),
        usersApi.getUsers(),
        izinApi.getIzins(),
      ]);

      const todayAttendances = attendances.filter((item) => isSameLocalDay(item.tanggal));
      const attendedUserIds = new Set(todayAttendances.map((item) => item.user?.id ?? item.user_id));
      const mahasiswaUsers = users.filter((item) => item.role !== 'ADMIN');
      const belumAbsen = mahasiswaUsers.filter((item) => !attendedUserIds.has(item.id)).length;
      const izinPending = izins.filter((item) => item.status === 'PENDING').length;

      const classCounts = todayAttendances.reduce((acc, item) => {
        const kelas = item.user?.kelas || 'Tanpa Kelas';
        acc[kelas] = (acc[kelas] || 0) + 1;
        return acc;
      }, {});
      const kelasTeraktif = Object.entries(classCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

      const trend7Hari = Array.from({ length: 7 }).map((_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        const dayItems = attendances.filter((item) => isSameLocalDay(item.tanggal, date));
        return {
          label: formatShortDate(date),
          hadir: dayItems.filter((item) => item.status !== 'TERLAMBAT').length,
          terlambat: dayItems.filter((item) => item.status === 'TERLAMBAT').length,
          total: dayItems.length,
        };
      });

      setInsights({ belumAbsen, izinPending, kelasTeraktif, trend7Hari });
    } catch (error) {
      console.error('Gagal mengambil insight dashboard:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchDashboardInsights();
  }, [activeTab, fetchStats, fetchDashboardInsights]);

  const tabs = [
    { id: 'absensi', label: 'Data Absensi', icon: <Calendar size={16} /> },
    { id: 'izin', label: 'Validasi Izin', icon: <FileText size={16} /> },
    { id: 'users', label: 'Mahasiswa', icon: <Users size={16} /> },
    { id: 'settings', label: 'Pengaturan', icon: <Settings2 size={16} /> },
  ];

  const classStats = useMemo(() => {
    const entries = Object.entries(stats.byKelas || {});
    if (entries.length === 0) {
      return CLASSES.map((kelas) => ({ kelas, total: 0, percent: 0 }));
    }
    const maxTotal = Math.max(...entries.map(([, value]) => Number(value) || 0), 1);
    return entries.map(([kelas, value]) => ({
      kelas,
      total: Number(value) || 0,
      percent: Math.min(100, Math.round(((Number(value) || 0) / maxTotal) * 100)),
    }));
  }, [stats.byKelas]);

  const attendanceRate = stats.totalToday > 0
    ? Math.round((stats.hadir / stats.totalToday) * 100)
    : 0;
  const maxTrendTotal = Math.max(...insights.trend7Hari.map((item) => item.total), 1);

  return (
    <div className="space-y-6">
      {/* Header Dashboard */}
      <div className="surface-hero overflow-hidden rounded-xl p-4 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className="flex min-w-0 flex-col justify-between gap-6">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent-500/25 bg-accent-500/10 text-accent-400 sm:h-12 sm:w-12">
                <Grid3X3 size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-accent-300/80">Command Center</p>
                <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-primary sm:text-3xl">Dashboard Admin</h1>
                <p className="mt-1 text-sm text-secondary">Monitoring apel Manajemen Informatika secara cepat dan terukur.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ['Total Hari Ini', stats.totalToday, Activity, 'text-accent-400'],
                ['Tepat Waktu', stats.hadir, ShieldCheck, 'text-success-500'],
                ['Terlambat', stats.terlambat, Clock, 'text-warning-500'],
              ].map(([label, value, Icon, tone]) => (
                <div key={label} className="admin-insight-panel p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase text-secondary">{label}</p>
                    <Icon size={17} className={tone} />
                  </div>
                  <p className="font-mono text-3xl font-bold text-primary">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-insight-panel p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-primary">Progress Per Kelas</p>
                <p className="mt-0.5 text-xs text-muted">Rasio hadir tepat waktu: {attendanceRate}%</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-info-500/20 bg-info-500/10 text-info-500">
                <BarChart3 size={20} />
              </div>
            </div>
            <div className="space-y-3">
              {classStats.map((item) => (
                <div key={item.kelas}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-secondary">{item.kelas}</span>
                    <span className="font-mono text-primary">{item.total}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            ['Belum Absen', insights.belumAbsen, UserX, 'text-warning-500'],
            ['Izin Pending', insights.izinPending, ClipboardList, 'text-warning-500'],
            ['Kelas Teraktif', insights.kelasTeraktif, Trophy, 'text-accent-400'],
            ['Tren 7 Hari', `${insights.trend7Hari.reduce((sum, item) => sum + item.total, 0)} absen`, TrendingUp, 'text-info-500'],
          ].map(([label, value, Icon, tone]) => (
            <div key={label} className="admin-insight-panel p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase text-secondary">{label}</p>
                <Icon size={16} className={tone} />
              </div>
              <p className="truncate font-mono text-xl font-bold text-primary">{value}</p>
            </div>
          ))}
        </div>

        <div className="admin-insight-panel mt-3 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-primary">Tren Hadir dan Terlambat</p>
              <p className="mt-0.5 text-xs text-muted">Ringkasan 7 hari terakhir dari rekap absensi.</p>
            </div>
            <TrendingUp size={18} className="text-info-500" />
          </div>
          <div className="grid grid-cols-7 gap-2">
            {insights.trend7Hari.map((item) => (
              <div key={item.label} className="flex min-w-0 flex-col items-center gap-2">
                <div className="flex h-20 w-full items-end justify-center rounded-lg border border-[var(--border-light)] bg-white/[.025] px-1 pb-1">
                  <div
                    className="w-full rounded-md bg-accent-500/70"
                    style={{ height: `${Math.max(8, (item.total / maxTrendTotal) * 100)}%` }}
                    title={`${item.total} absen, ${item.terlambat} terlambat`}
                  />
                </div>
                <span className="truncate text-[10px] font-mono text-muted">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pill Tabs Navigation */}
      <div className="-mx-3 overflow-x-auto px-3 pb-2 hide-scrollbar sm:mx-0 sm:px-0">
        <nav className="flex min-w-max gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-pill ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'absensi' && <TabAbsensi notify={notify} requestConfirm={requestConfirm} />}
        {activeTab === 'izin' && <TabIzin notify={notify} requestConfirm={requestConfirm} />}
        {activeTab === 'users' && <TabUsers notify={notify} requestConfirm={requestConfirm} />}
        {activeTab === 'settings' && <TabSettings notify={notify} requestConfirm={requestConfirm} />}
      </div>
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      <ConfirmDialog dialog={dialog} onClose={closeConfirm} />
    </div>
  );
}
