import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useDebounce, useButtonGuard } from '../hooks/useDebounce';

const API = `${import.meta.env.VITE_API_URL || ''}/api`;
const token = () => localStorage.getItem('token');
const headers = () => ({ Authorization: `Bearer ${token()}` });

const CLASSES = ['MI 4A', 'MI 4B', 'MI 4C', 'MI 4D'];

// ============================================================
// MODAL KOMPONEN
// ============================================================
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5 sticky top-0 bg-white z-10 pb-2 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// STATUS BADGE HELPER
// ============================================================
const getStatusBadge = (status) => {
  if (status === 'TERLAMBAT') return { bg: 'bg-orange-100 text-orange-700 border border-orange-200', label: 'Terlambat' };
  return { bg: 'bg-emerald-100 text-emerald-700 border border-emerald-200', label: 'Hadir' };
};

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
  const [exportLocked, guardExport] = useButtonGuard(2000);

  const fetchAttendances = useCallback(async (kelas) => {
    try {
      let url = `${API}/attendance?`;
      if (kelas && kelas !== 'Semua Kelas') url += `kelas=${encodeURIComponent(kelas)}&`;
      const res = await axios.get(url, { headers: headers() });
      setAttendances(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchAttendances(debouncedKelas);
  }, [debouncedKelas, fetchAttendances]);


  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus data absensi ini?')) return;
    setDeleting(id);
    try {
      await axios.delete(`${API}/attendance/${id}`, { headers: headers() });
      fetchAttendances(debouncedKelas);
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus');
    } finally {
      setDeleting(null);
    }
  };

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

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Rekap Absensi Mahasiswa', 148, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Smart Attendance - Manajemen Informatika`, 148, 22, { align: 'center' });
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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center w-full md:w-auto">
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="w-full md:w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="">Semua Kelas</option>
            {CLASSES.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={exportExcel}
            disabled={loading}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Excel
          </button>
          <button
            onClick={exportPDF}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            PDF
          </button>
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Mahasiswa</th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Foto</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {attendances.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-slate-400">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-2 text-slate-200">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Belum ada data absensi.
                  </td>
                </tr>
              ) : attendances.map((a, i) => {
                const sBadge = getStatusBadge(a.status);
                
                return (
                  <tr key={a.id_absensi} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{a.user.name}</div>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="text-xs font-mono text-slate-400">{a.user.npm || '-'}</span>
                        <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded text-[10px] font-bold border border-sky-100">
                          {a.user.kelas || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-600 text-xs font-medium">
                        {new Date(a.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="font-mono text-xs text-slate-500 mt-1">
                        {a.jam_absen ? new Date(a.jam_absen).toLocaleTimeString('id-ID') : '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${sBadge.bg}`}>
                        {sBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {a.foto_selfie ? (
                        <img
                          src={a.foto_selfie}
                          alt="Selfie"
                          className="w-10 h-10 rounded-xl object-cover border-2 border-slate-200 cursor-pointer hover:border-sky-400 hover:scale-110 transition-all shadow-sm"
                          onClick={() => setSelectedPhoto(a.foto_selfie)}
                        />
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(a.id_absensi)}
                        disabled={deleting === a.id_absensi}
                        className="px-2.5 py-1.5 text-xs text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all font-medium disabled:opacity-50"
                      >
                        {deleting === a.id_absensi ? '...' : 'Hapus'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setSelectedPhoto(null)}>
          <img src={selectedPhoto} alt="Selfie" className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl border-4 border-white" />
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
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', npm: '', kelas: 'MI 4A' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const debouncedFilterKelas = useDebounce(filterKelas, 300);
  const [actionLocked, guardAction] = useButtonGuard(1500);

  const fetchUsers = useCallback(async (kelas) => {
    try {
      let url = `${API}/users`;
      if (kelas && kelas !== 'Semua Kelas') url += `?kelas=${encodeURIComponent(kelas)}`;
      const res = await axios.get(url, { headers: headers() });
      setUsers(res.data);
    } catch {}
  }, []);

  useEffect(() => { 
    fetchUsers(debouncedFilterKelas); 
    setCurrentPage(1); // Reset page on filter change
  }, [debouncedFilterKelas, fetchUsers]);

  // Filter & Search Logic
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const lowerQ = searchQuery.toLowerCase();
    return users.filter(u => 
      (u.name && u.name.toLowerCase().includes(lowerQ)) || 
      (u.npm && u.npm.toLowerCase().includes(lowerQ))
    );
  }, [users, searchQuery]);

  // Pagination Logic
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
        await axios.put(`${API}/users/${editUser.id}`, form, { headers: headers() });
        setActionMsg('Data mahasiswa berhasil diperbarui');
      } else {
        await axios.post(`${API}/users`, form, { headers: headers() });
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
      await axios.delete(`${API}/users/${user.id}`, { headers: headers() });
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
      const res = await axios.put(`${API}/users/${user.id}/reset-password`, {}, { headers: headers() });
      setActionMsg(res.data.message);
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal reset password');
    }
  });

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
          {/* Dropdown Kelas */}
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="w-full md:w-48 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="">Semua Kelas</option>
            {CLASSES.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          
          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input
              type="text"
              placeholder="Cari nama atau NPM..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all bg-slate-50"
            />
          </div>
        </div>
        
        <button
          onClick={openAdd}
          className="w-full md:w-auto flex justify-center items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Tambah Mahasiswa
        </button>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm font-medium">{actionMsg}</div>
      )}

      {/* Tabel Data - Responsive */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-semibold text-slate-700 text-sm">
            Total: <span className="text-sky-600 font-bold">{filteredUsers.length}</span> mahasiswa ditemukan
          </h3>
        </div>
        
        {/* Mobile View (Cards) */}
        <div className="block md:hidden">
          {currentData.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">Data mahasiswa tidak ditemukan.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {currentData.map((u, i) => (
                <div key={u.id} className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-800">{u.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{u.npm || '-'}</div>
                    </div>
                    <span className="px-2.5 py-1 bg-sky-50 text-sky-700 rounded-lg text-xs font-bold border border-sky-100">
                      {u.kelas || '-'}
                    </span>
                  </div>
                  <div className="flex gap-2 w-full pt-2">
                    <button onClick={() => openEdit(u)} className="flex-1 py-2 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 font-semibold border border-blue-100">Edit</button>
                    <button onClick={() => handleResetPassword(u)} className="flex-1 py-2 text-xs text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 font-semibold border border-amber-100">Reset PW</button>
                    <button onClick={() => handleDelete(u)} className="flex-1 py-2 text-xs text-red-600 bg-red-50 rounded-lg hover:bg-red-100 font-semibold border border-red-100">Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3">No</th>
                <th className="px-5 py-3">Nama Mahasiswa</th>
                <th className="px-5 py-3">NPM</th>
                <th className="px-5 py-3">Kelas</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-slate-400">Data mahasiswa tidak ditemukan.</td>
                </tr>
              ) : currentData.map((u, i) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4 text-slate-400 text-xs">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-800">{u.name}</div>
                  </td>
                  <td className="px-5 py-4 font-mono text-sm text-slate-600">{u.npm || '-'}</td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 bg-sky-50 text-sky-700 rounded-lg text-xs font-bold border border-sky-100">
                      {u.kelas || '-'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(u)} className="px-3 py-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all font-semibold">Edit</button>
                      <button onClick={() => handleResetPassword(u)} className="px-3 py-1.5 text-xs text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-all font-semibold">Reset PW</button>
                      <button onClick={() => handleDelete(u)} className="px-3 py-1.5 text-xs text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all font-semibold">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <span className="text-sm text-slate-500">
              Halaman <span className="font-semibold text-slate-700">{currentPage}</span> dari <span className="font-semibold text-slate-700">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editUser ? 'Edit Mahasiswa' : 'Tambah Mahasiswa Baru'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Masukkan nama lengkap"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">NPM</label>
              <input type="text" value={form.npm} onChange={e => setForm({ ...form, npm: e.target.value })} placeholder="Contoh: 24781001"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all" />
              <p className="text-xs text-slate-400 mt-1">NPM juga digunakan sebagai password login mahasiswa</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Kelas</label>
              <select value={form.kelas} onChange={e => setForm({ ...form, kelas: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all bg-white">
                {CLASSES.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{formError}</div>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all text-sm">Batal</button>
              <button onClick={handleSubmit} disabled={formLoading}
                className="flex-1 py-2.5 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-all text-sm disabled:opacity-50">
                {formLoading ? 'Menyimpan...' : editUser ? 'Simpan Perubahan' : 'Tambah Mahasiswa'}
              </button>
            </div>
          </div>
        </Modal>
      )}
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

  // Form tambah / edit lokasi
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nama_lokasi: '', latitude: '', longitude: '', radius_meter: '100' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [saveLocked, guardSave] = useButtonGuard(1500);
  const [actionLocked, guardAction] = useButtonGuard(1000);

  // Fetch semua data
  const fetchData = async () => {
    try {
      const [settingsRes, lokasiRes] = await Promise.all([
        axios.get(`${API}/settings`, { headers: headers() }),
        axios.get(`${API}/lokasi`, { headers: headers() }),
      ]);
      setBatasTerlambat(settingsRes.data.BATAS_TERLAMBAT || '08:00');
      setLocations(lokasiRes.data);
      const activeLoc = lokasiRes.data.find(l => l.is_active);
      if (activeLoc) setActiveLocationId(activeLoc.id);
    } catch {}
  };

  useEffect(() => { fetchData(); }, []);

  // Simpan BATAS_TERLAMBAT
  const handleSaveSettings = guardSave(async () => {
    setLoading(true); setMsg(''); setError('');
    try {
      const res = await axios.put(`${API}/settings`, { BATAS_TERLAMBAT: batasTerlambat }, { headers: headers() });
      setMsg(res.data.message);
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  });

  // Aktifkan lokasi
  const handleActivate = guardAction(async (id) => {
    try {
      await axios.put(`${API}/lokasi/${id}/activate`, {}, { headers: headers() });
      setMsg('Lokasi berhasil diaktifkan');
      setTimeout(() => setMsg(''), 3000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengaktifkan lokasi');
    }
  });

  // Buka form tambah lokasi
  const openAddForm = () => {
    setEditId(null);
    setForm({ nama_lokasi: '', latitude: '', longitude: '', radius_meter: '100' });
    setFormError('');
    setShowForm(true);
  };

  // Buka form edit lokasi
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

  // Simpan / edit lokasi
  const handleSubmitLocation = guardAction(async () => {
    if (!form.nama_lokasi || !form.latitude || !form.longitude) {
      setFormError('Nama lokasi, latitude, dan longitude wajib diisi');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      if (editId) {
        await axios.put(`${API}/lokasi/${editId}`, form, { headers: headers() });
        setMsg('Lokasi berhasil diperbarui');
      } else {
        await axios.post(`${API}/lokasi`, form, { headers: headers() });
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

  // Hapus lokasi
  const handleDeleteLocation = guardAction(async (loc) => {
    if (loc.is_default) {
      setError('Lokasi default tidak dapat dihapus');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (!confirm(`Hapus lokasi "${loc.nama_lokasi}"?`)) return;
    try {
      await axios.delete(`${API}/lokasi/${loc.id}`, { headers: headers() });
      setMsg('Lokasi berhasil dihapus');
      setTimeout(() => setMsg(''), 3000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menghapus lokasi');
    }
  });

  return (
    <div className="max-w-3xl space-y-6">
      {/* === Pilih Lokasi Aktif === */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Lokasi Titik Apel Aktif</h3>
            <p className="text-sm text-slate-400 mt-1">Pilih lokasi yang digunakan saat mahasiswa melakukan absen apel.</p>
          </div>
          <button
            onClick={openAddForm}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition-all shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Tambah Lokasi
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {locations.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm bg-slate-50 rounded-xl">
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
                      ? 'bg-sky-50 border-sky-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-800 text-sm">{loc.nama_lokasi}</h4>
                        {isActive && (
                          <span className="px-2 py-0.5 bg-sky-600 text-white rounded-full text-[10px] font-bold">AKTIF</span>
                        )}
                        {loc.is_default && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold border border-amber-200">DEFAULT</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500 font-mono">
                        <span>Lat: {loc.latitude}</span>
                        <span>Lng: {loc.longitude}</span>
                        <span>Radius: {loc.radius_meter}m</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {!isActive && (
                        <button
                          onClick={() => handleActivate(loc.id)}
                          className="px-3 py-1.5 text-xs bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-all font-semibold"
                        >
                          Aktifkan
                        </button>
                      )}
                      <button
                        onClick={() => openEditForm(loc)}
                        className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-semibold border border-blue-100"
                      >
                        Edit
                      </button>
                      {!loc.is_default && (
                        <button
                          onClick={() => handleDeleteLocation(loc)}
                          className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-semibold border border-red-100"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* === Modal Form Tambah / Edit Lokasi === */}
      {showForm && (
        <Modal title={editId ? 'Edit Lokasi' : 'Tambah Lokasi Baru'} onClose={() => setShowForm(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lokasi</label>
              <input type="text" value={form.nama_lokasi} onChange={e => setForm({ ...form, nama_lokasi: e.target.value })}
                placeholder="Contoh: Lapangan GSG Polinela"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Latitude</label>
                <input type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })}
                  placeholder="-5.3569503"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Longitude</label>
                <input type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })}
                  placeholder="105.2317229"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Radius Absen (meter)</label>
              <input type="number" min="10" max="5000" value={form.radius_meter} onChange={e => setForm({ ...form, radius_meter: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all" />
              <p className="text-xs text-slate-400 mt-1">Jarak maksimal mahasiswa dari titik ini agar absen diterima.</p>
            </div>
            {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{formError}</div>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all text-sm">
                Batal
              </button>
              <button onClick={handleSubmitLocation} disabled={formLoading}
                className="flex-1 py-2.5 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-all text-sm disabled:opacity-50">
                {formLoading ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Tambah Lokasi'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* === Batas Jam Tepat Waktu === */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-800 text-base mb-1">Batas Jam Tepat Waktu</h3>
          <p className="text-sm text-slate-400 mb-4">Mahasiswa yang absen setelah jam ini akan dicatat sebagai TERLAMBAT.</p>
          <div className="flex items-center gap-3">
            <input type="time" value={batasTerlambat} onChange={e => setBatasTerlambat(e.target.value)}
              className="w-40 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all" />
            <span className="text-slate-500 text-sm">WIB</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      {msg && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm font-medium">{msg}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{error}</div>}

      {/* Tombol Simpan Pengaturan */}
      <div className="flex gap-3">
        <button onClick={fetchData} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all text-sm">
          Muat Ulang
        </button>
        <button id="btn-save-settings" onClick={handleSaveSettings} disabled={loading}
          className="px-6 py-2.5 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-all text-sm shadow-sm disabled:opacity-50">
          {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>

      <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl">
        <p className="text-sm text-sky-700 font-medium">Catatan Penting</p>
        <p className="text-xs text-sky-600 mt-1">
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

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/attendance/stats`, { headers: headers() });
      setStats(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchStats();
  }, [activeTab]); // Refresh stats when tab changes

  const tabs = [
    {
      id: 'absensi', label: 'Data Absensi',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    },
    {
      id: 'users', label: 'Manajemen Mahasiswa',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    },
    {
      id: 'settings', label: 'Pengaturan',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
    }
  ];

  return (
    <div className="space-y-5">
      {/* Header & Stats */}
      <div className="bg-gradient-to-br from-sky-600 to-blue-700 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">Dashboard Admin</h1>
            <p className="text-sky-200 text-sm">Smart Attendance — Manajemen Informatika</p>
          </div>
        </div>

        {/* Stats Grid Hari Ini */}
        <div className="grid grid-cols-3 gap-4 relative z-10">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
            <p className="text-sky-200 text-sm font-medium mb-1">Total Absen Hari Ini</p>
            <p className="text-3xl font-bold">{stats.totalToday}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
            <p className="text-emerald-300 text-sm font-medium mb-1">Hadir Tepat Waktu</p>
            <p className="text-3xl font-bold text-emerald-100">{stats.hadir}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
            <p className="text-orange-300 text-sm font-medium mb-1">Terlambat</p>
            <p className="text-3xl font-bold text-orange-100">{stats.terlambat}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 flex flex-wrap gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'absensi' && <TabAbsensi />}
        {activeTab === 'users' && <TabUsers />}
        {activeTab === 'settings' && <TabSettings />}
      </div>
    </div>
  );
}
