import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar, FileText, Clock, Layers, Users, Settings2,
  Download, Search, Plus, Navigation, MapPin,
  Grid3X3, ChevronLeft, ChevronRight
} from 'lucide-react';
import { attendanceApi } from '../services/attendanceApi';
import { usersApi } from '../services/usersApi';
import { lokasiApi } from '../services/lokasiApi';
import { settingsApi } from '../services/settingsApi';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useDebounce, useButtonGuard } from '../hooks/useDebounce';
import TabMasterData from '../components/admin/TabMasterData';
import TabJadwal from '../components/admin/TabJadwal';
import TabIzin from '../components/admin/TabIzin';

import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card, { CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';

const CLASSES = ['MI 4A', 'MI 4B', 'MI 4C', 'MI 4D'];

// ============================================================
// TAB ABSENSI
// ============================================================
function TabAbsensi() {
  const [attendances, setAttendances] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const debouncedKelas = useDebounce(selectedKelas, 300);
  const [, guardExport] = useButtonGuard(2000);
  const [, guardDeleteAttendance] = useButtonGuard(1200);

  const fetchAttendances = useCallback(async (kelas) => {
    try {
      const data = await attendanceApi.getAttendance({ kelas: kelas !== 'Semua Kelas' ? kelas : undefined });
      setAttendances(data);
    } catch (error) {
      console.error("Gagal mengambil data absensi:", error);
    }
  }, []);

  useEffect(() => {
    fetchAttendances(debouncedKelas);
  }, [debouncedKelas, fetchAttendances]);

  const handleDelete = guardDeleteAttendance(async (id) => {
    if (!confirm('Yakin ingin menghapus data absensi ini?')) return;
    setDeleting(id);
    try {
      await attendanceApi.deleteAttendance(id);
      fetchAttendances(debouncedKelas);
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus');
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
      alert('Gagal mengexport data');
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
      alert('Gagal mengexport PDF');
    }
  });

  const absensiHeaders = [
    { label: 'No' },
    { label: 'Mahasiswa' },
    { label: 'Waktu' },
    { label: 'Status' },
    { label: 'Jarak' },
    { label: 'Foto' },
    { label: 'Lokasi' },
    { label: 'Aksi', align: 'right' },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
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

      <Table headers={absensiHeaders}>
        {attendances.length === 0 ? (
          <tr>
            <td colSpan={absensiHeaders.length} className="px-4 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
              <Calendar size={40} className="mx-auto mb-2 opacity-20" />
              Belum ada data absensi.
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
            <td className="px-4 py-3 text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(a.id_absensi)}
                disabled={deleting === a.id_absensi}
                style={{ color: '#f87171' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {deleting === a.id_absensi ? '...' : 'Hapus'}
              </Button>
            </td>
          </tr>
        ))}
      </Table>

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
function TabUsers() {
  const [users, setUsers] = useState([]);
  const [filterKelas, setFilterKelas] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
    try {
      const data = await usersApi.getUsers({ kelas: kelas !== 'Semua Kelas' ? kelas : undefined });
      setUsers(data);
    } catch (error) {
      console.error("Gagal mengambil data mahasiswa:", error);
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
      } else {
        await usersApi.createUser(form);
        setActionMsg('Mahasiswa berhasil ditambahkan');
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
    if (!confirm(`Hapus mahasiswa "${user.name}"?\nSeluruh data absensinya juga akan dihapus.`)) return;
    try {
      await usersApi.deleteUser(user.id);
      setActionMsg('Mahasiswa berhasil dihapus');
      fetchUsers(debouncedFilterKelas);
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus');
    }
  });

  const handleResetPassword = guardAction(async (user) => {
    if (!confirm(`Reset password "${user.name}" ke NPM (${user.npm})?`)) return;
    try {
      const data = await usersApi.resetPassword(user.id);
      setActionMsg(data.message);
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal reset password');
    }
  });

  const userHeaders = [
    { label: 'No' },
    { label: 'Nama Mahasiswa' },
    { label: 'NPM' },
    { label: 'Kelas' },
    { label: 'Aksi', align: 'right' },
  ];

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
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

          <Button variant="primary" size="md" onClick={openAdd} className="w-full md:w-auto justify-center">
            <Plus size={15} />
            Tambah Mahasiswa
          </Button>
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
          {currentData.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Data mahasiswa tidak ditemukan.</div>
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
                  <div className="flex gap-2 w-full pt-2">
                    <button onClick={() => openEdit(u)} className="flex-1 py-2 text-xs font-semibold rounded-lg" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8' }}>Edit</button>
                    <button onClick={() => handleResetPassword(u)} className="flex-1 py-2 text-xs font-semibold rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>Reset PW</button>
                    <button onClick={() => handleDelete(u)} className="flex-1 py-2 text-xs font-semibold rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:block">
          <Table headers={userHeaders}>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={userHeaders.length} className="px-5 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                  Data mahasiswa tidak ditemukan.
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
                <td className="px-5 py-4">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(u)} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}>Edit</button>
                    <button onClick={() => handleResetPassword(u)} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'}>Reset PW</button>
                    <button onClick={() => handleDelete(u)} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}>Hapus</button>
                  </div>
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
function TabSettings() {
  const [locations, setLocations] = useState([]);
  const [activeLocationId, setActiveLocationId] = useState(null);
  const [batasTerlambat, setBatasTerlambat] = useState('08:00');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nama_lokasi: '', latitude: '', longitude: '', radius_meter: '100' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [, guardSave] = useButtonGuard(1500);
  const [, guardAction] = useButtonGuard(1000);

  const fetchData = useCallback(async () => {
    try {
      const [settingsRes, lokasiRes] = await Promise.all([
        settingsApi.getSettings(),
        lokasiApi.getLokasi(),
      ]);
      setBatasTerlambat(settingsRes.BATAS_TERLAMBAT || '08:00');
      setLocations(lokasiRes);
      const activeLoc = lokasiRes.find(l => l.is_active);
      if (activeLoc) setActiveLocationId(activeLoc.id);
    } catch (error) {
      console.error("Gagal mengambil data pengaturan atau lokasi:", error);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReloadSettings = guardAction(fetchData);

  const handleSaveSettings = guardSave(async () => {
    setLoading(true); setMsg(''); setError('');
    try {
      const data = await settingsApi.updateSettings({ BATAS_TERLAMBAT: batasTerlambat });
      setMsg(data.message);
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  });

  const handleActivate = guardAction(async (id) => {
    try {
      await lokasiApi.activateLokasi(id);
      setMsg('Lokasi berhasil diaktifkan');
      setTimeout(() => setMsg(''), 3000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengaktifkan lokasi');
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
      } else {
        await lokasiApi.createLokasi(form);
        setMsg('Lokasi berhasil ditambahkan');
      }
      setShowForm(false);
      setTimeout(() => setMsg(''), 3000);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Gagal menyimpan lokasi');
    } finally {
      setFormLoading(false);
    }
  });

  const handleDeleteLocation = guardAction(async (loc) => {
    if (loc.is_default) {
      setError('Lokasi default tidak dapat dihapus');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!confirm(`Hapus lokasi "${loc.nama_lokasi}"?`)) return;
    try {
      await lokasiApi.deleteLokasi(loc.id);
      setMsg('Lokasi berhasil dihapus');
      setTimeout(() => setMsg(''), 3000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menghapus lokasi');
    }
  });

  return (
    <div className="max-w-3xl space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
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
                    <div className="flex gap-1.5 shrink-0">
                      {!isActive && (
                        <Button variant="primary" size="sm" onClick={() => handleActivate(loc.id)}>
                          Aktifkan
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openEditForm(loc)} style={{ color: '#38bdf8' }}>
                        Edit
                      </Button>
                      {!loc.is_default && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteLocation(loc)} style={{ color: '#f87171' }}>
                          Hapus
                        </Button>
                      )}
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

      <Card className="p-6">
        <div>
          <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>Batas Jam Tepat Waktu</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Mahasiswa yang absen setelah jam ini akan dicatat sebagai TERLAMBAT.</p>
          <div className="flex items-center gap-3">
            <input type="time" value={batasTerlambat} onChange={e => setBatasTerlambat(e.target.value)}
              className="w-40 px-4 py-2.5 rounded-xl text-sm transition-all outline-none"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--border-focus)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>WIB</span>
          </div>
        </div>
      </Card>

      {msg && <div className="p-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>{msg}</div>}
      {error && <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>{error}</div>}

      <div className="flex gap-3">
        <Button variant="secondary" size="md" onClick={handleReloadSettings}>
          Muat Ulang
        </Button>
        <Button id="btn-save-settings" variant="primary" size="md" onClick={handleSaveSettings} loading={loading}>
          Simpan Pengaturan
        </Button>
      </div>

      <div className="p-4 rounded-2xl" style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)' }}>
        <p className="text-sm font-medium" style={{ color: '#38bdf8' }}>Catatan Penting</p>
        <p className="text-xs mt-1" style={{ color: 'rgba(56,189,248,0.8)' }}>
          Lokasi aktif akan digunakan saat mahasiswa melakukan absen apel. Radius absen setiap lokasi bisa berbeda.
          Gunakan Google Maps untuk mendapatkan koordinat yang tepat. Lokasi default tidak dapat dihapus.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN DASHBOARD UTAMA
// ============================================================
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('absensi');
  const [stats, setStats] = useState({ totalToday: 0, hadir: 0, terlambat: 0, byKelas: {} });

  const fetchStats = useCallback(async () => {
    try {
      const data = await attendanceApi.getStats();
      setStats(data);
    } catch (error) {
      console.error("Gagal mengambil stats absensi:", error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [activeTab, fetchStats]);

  const tabs = [
    { id: 'absensi', label: 'Data Absensi', icon: <Calendar size={16} /> },
    { id: 'izin', label: 'Validasi Izin', icon: <FileText size={16} /> },
    { id: 'jadwal', label: 'Jadwal Apel', icon: <Clock size={16} /> },
    { id: 'master', label: 'Data Akademik', icon: <Layers size={16} /> },
    { id: 'users', label: 'Mahasiswa', icon: <Users size={16} /> },
    { id: 'settings', label: 'Pengaturan', icon: <Settings2 size={16} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header Dashboard */}
      <div className="surface-hero rounded-xl p-4 sm:p-6">
        <div className="mb-5 flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent-500/25 bg-accent-500/10 text-accent-400 sm:h-12 sm:w-12">
            <Grid3X3 size={24} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-primary">Dashboard Admin</h1>
            <p className="mt-0.5 truncate text-sm text-accent-300/80">Smart Attendance - Manajemen Informatika</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ['Total Absen Hari Ini', stats.totalToday],
            ['Hadir Tepat Waktu', stats.hadir],
            ['Terlambat', stats.terlambat],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-accent-500/15 bg-white/[.025] p-4">
              <p className="mb-1 text-sm font-medium text-accent-300/75">{label}</p>
              <p className="text-3xl font-bold text-primary">{value}</p>
            </div>
          ))}
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
        {activeTab === 'absensi' && <TabAbsensi />}
        {activeTab === 'izin' && <TabIzin />}
        {activeTab === 'jadwal' && <TabJadwal />}
        {activeTab === 'master' && <TabMasterData />}
        {activeTab === 'users' && <TabUsers />}
        {activeTab === 'settings' && <TabSettings />}
      </div>
    </div>
  );
}
