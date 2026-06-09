import { useState, useEffect } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => localStorage.getItem('token');
const headers = () => ({ Authorization: `Bearer ${token()}` });

const CLASSES = ['MI 4A', 'MI 4B', 'MI 4C', 'MI 4D'];

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
const getStatusBadge = (status, admin_action) => {
  if (status === 'PENDING') {
    if (admin_action === 'REJECTED') {
      return { bg: 'bg-red-100 text-red-700 border border-red-200', label: 'Ditolak' };
    }
    return { bg: 'bg-amber-100 text-amber-700 border border-amber-200', label: 'Pending' };
  }
  if (status === 'TERLAMBAT') return { bg: 'bg-orange-100 text-orange-700 border border-orange-200', label: 'Terlambat' };
  return { bg: 'bg-emerald-100 text-emerald-700 border border-emerald-200', label: 'Hadir' };
};

const getValidasiBadge = (validasi) => {
  if (validasi === 'VALID') return { bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100', label: 'Valid' };
  if (validasi === 'DI_LUAR_RADIUS') return { bg: 'bg-red-50 text-red-600 border border-red-100', label: 'Luar Radius' };
  return { bg: 'bg-amber-50 text-amber-600 border border-amber-100', label: 'Mencurigakan' };
};

// ============================================================
// TAB ABSENSI
// ============================================================
function TabAbsensi() {
  const [attendances, setAttendances] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [filterValidasi, setFilterValidasi] = useState('Semua');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetchAttendances(selectedKelas, filterValidasi);
  }, [selectedKelas, filterValidasi]);

  const fetchAttendances = async (kelas, validasi) => {
    try {
      let url = `${API}/attendance?`;
      if (kelas && kelas !== 'Semua Kelas') url += `kelas=${encodeURIComponent(kelas)}&`;
      if (validasi && validasi !== 'Semua') url += `validasi=${encodeURIComponent(validasi)}`;
      
      const res = await axios.get(url, { headers: headers() });
      setAttendances(res.data);
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus data absensi ini?')) return;
    setDeleting(id);
    try {
      await axios.delete(`${API}/attendance/${id}`, { headers: headers() });
      fetchAttendances(selectedKelas, filterValidasi);
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus');
    } finally {
      setDeleting(null);
    }
  };

  const exportExcel = async () => {
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
        { header: 'Validasi', key: 'validasi', width: 20 },
        { header: 'Akurasi GPS (m)', key: 'accuracy', width: 15 },
        { header: 'Jarak (m)', key: 'jarak', width: 15 },
        { header: 'Latitude', key: 'lat', width: 15 },
        { header: 'Longitude', key: 'lng', width: 15 },
        { header: 'IP Address', key: 'ip', width: 15 },
        { header: 'Browser & Platform', key: 'device', width: 25 },
        { header: 'Catatan Admin', key: 'admin_note', width: 30 }
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
          validasi: a.validasi_lokasi,
          accuracy: a.accuracy !== null ? a.accuracy.toFixed(2) : '-',
          jarak: a.jarak_dari_titik !== null ? a.jarak_dari_titik.toFixed(2) : '-',
          lat: a.latitude,
          lng: a.longitude,
          ip: a.ip_address || '-',
          device: `${a.browser || '-'} / ${a.platform || '-'}`,
          admin_note: a.admin_note || '-'
        });
        if (a.status === 'TERLAMBAT') {
          row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          row.getCell('status').font = { color: { argb: 'FFD97706' }, bold: true };
        } else if (a.status === 'PENDING') {
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
  };

  const exportPDF = () => {
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

      // Garis pemisah
      doc.setDrawColor(2, 132, 199);
      doc.setLineWidth(0.5);
      doc.line(14, 31, 283, 31);

      // Tabel
      const tableData = attendances.map((a, i) => [
        i + 1,
        a.user.name,
        a.user.kelas || '-',
        new Date(a.tanggal).toLocaleDateString('id-ID'),
        a.jam_absen ? new Date(a.jam_absen).toLocaleTimeString('id-ID') : '-',
        a.status === 'TERLAMBAT' ? 'Terlambat' : a.status === 'PENDING' ? 'Pending' : 'Hadir',
        a.validasi_lokasi === 'VALID' ? 'Valid' : 'Suspect',
        a.jarak_dari_titik !== null ? `${a.jarak_dari_titik.toFixed(1)}m` : '-',
        a.accuracy !== null ? `±${a.accuracy.toFixed(1)}m` : '-'
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['No', 'Nama Mahasiswa', 'Kelas', 'Tanggal', 'Waktu Absen', 'Status', 'Validasi', 'Jarak', 'Akurasi GPS']],
        body: tableData,
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [2, 132, 199],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { cellWidth: 50 },
          2: { halign: 'center', cellWidth: 20 },
          3: { halign: 'center', cellWidth: 30 },
          4: { halign: 'center', cellWidth: 25 },
          5: { halign: 'center', cellWidth: 22 },
          6: { halign: 'center', cellWidth: 22 },
          7: { halign: 'center', cellWidth: 20 },
          8: { halign: 'center', cellWidth: 25 },
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            if (data.cell.raw === 'Terlambat' || data.cell.raw === 'Pending') {
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

      // Footer
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
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex bg-slate-100 rounded-xl p-1">
            {['Semua Kelas', ...CLASSES].map(k => (
              <button
                key={k}
                onClick={() => setSelectedKelas(k === 'Semua Kelas' ? '' : k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  (selectedKelas === '' && k === 'Semua Kelas') || selectedKelas === k
                    ? 'bg-white text-sky-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          
          <div className="h-6 w-px bg-slate-200 mx-1"></div>

          <div className="flex bg-slate-100 rounded-xl p-1">
            {['Semua', 'VALID', 'MENCURIGAKAN'].map(v => (
              <button
                key={v}
                onClick={() => setFilterValidasi(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterValidasi === v
                    ? 'bg-white text-sky-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {v === 'Semua' ? 'Semua Status' : v === 'VALID' ? 'Valid' : 'Mencurigakan'}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={exportExcel}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Excel
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm"
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
                <th className="px-4 py-3">Validasi</th>
                <th className="px-4 py-3">GPS Data</th>
                <th className="px-4 py-3">Foto</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {attendances.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-slate-400">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-2 text-slate-200">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Belum ada data absensi.
                  </td>
                </tr>
              ) : attendances.map((a, i) => {
                const sBadge = getStatusBadge(a.status, a.admin_action);
                const vBadge = getValidasiBadge(a.validasi_lokasi);
                
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
                      <span className={`px-2 py-0.5 rounded-lg text-[11px] font-medium ${vBadge.bg}`}>
                        {vBadge.label}
                      </span>
                      {a.alasan_flag && (
                        <div className="text-[10px] text-red-500 mt-1 max-w-[120px] truncate" title={a.alasan_flag}>
                          {a.alasan_flag}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[11px] text-slate-500">
                        Akurasi: <span className="font-mono font-medium">{a.accuracy !== null ? `±${a.accuracy.toFixed(1)}m` : '-'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Jarak: <span className="font-mono font-medium">{a.jarak_dari_titik !== null ? `${a.jarak_dari_titik.toFixed(1)}m` : '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {a.foto_selfie ? (
                        <img
                          src={`${BASE_URL}${a.foto_selfie}`}
                          alt="Selfie"
                          className="w-10 h-10 rounded-xl object-cover border-2 border-slate-200 cursor-pointer hover:border-sky-400 hover:scale-110 transition-all shadow-sm"
                          onClick={() => setSelectedPhoto(`${BASE_URL}${a.foto_selfie}`)}
                        />
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setSelectedPhoto(null)}>
          <img src={selectedPhoto} alt="Selfie" className="max-w-sm max-h-[80vh] rounded-2xl shadow-2xl border-4 border-white" />
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB VERIFIKASI (PENDING)
// ============================================================
function TabVerifikasi({ onVerified }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { id, type: 'APPROVED'|'REJECTED', name }
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await axios.get(`${API}/attendance/pending`, { headers: headers() });
      setPending(res.data);
    } catch {}
  };

  const handleAction = async () => {
    if (!actionModal) return;
    setLoading(true);
    try {
      await axios.put(`${API}/attendance/${actionModal.id}/verify`, {
        action: actionModal.type,
        note
      }, { headers: headers() });
      
      setActionModal(null);
      setNote('');
      fetchPending();
      if (onVerified) onVerified(); // Update stats
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memproses verifikasi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 items-start">
        <div className="mt-0.5 text-amber-500">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <h3 className="text-amber-800 font-semibold text-sm">Verifikasi Manual Diperlukan</h3>
          <p className="text-amber-700 text-xs mt-1">
            Data absensi di bawah ini ditandai sebagai mencurigakan (kemungkinan Fake GPS atau sinyal tidak akurat). Silakan tinjau dan putuskan apakah absensi disetujui atau ditolak.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pending.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-100 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 className="font-bold text-slate-700">Antrian Kosong</h3>
            <p className="text-slate-400 text-sm mt-1">Semua absensi telah diverifikasi.</p>
          </div>
        ) : pending.map(p => (
          <div key={p.id_absensi} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-slate-800">{p.user.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">{p.user.npm} • {p.user.kelas}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-600">{new Date(p.tanggal).toLocaleDateString('id-ID')}</p>
                  <p className="text-xs font-mono text-slate-500">{new Date(p.jam_absen).toLocaleTimeString('id-ID')}</p>
                </div>
              </div>
              <div className="bg-red-50 text-red-600 text-[11px] font-medium p-2 rounded-lg border border-red-100 mt-3">
                <span className="block font-bold mb-1">Penyebab Flag:</span>
                {p.alasan_flag || 'Tidak diketahui'}
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-400 mb-0.5">Akurasi GPS</p>
                  <p className="font-medium text-slate-700">{p.accuracy !== null ? `±${p.accuracy.toFixed(1)}m` : 'Tidak tersedia'}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-0.5">Jarak ke Titik</p>
                  <p className="font-medium text-slate-700">{p.jarak_dari_titik !== null ? `${p.jarak_dari_titik.toFixed(1)}m` : 'Tidak tersedia'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 mb-0.5">Device / Browser</p>
                  <p className="font-medium text-slate-700 truncate" title={p.device_info}>{p.browser || 'Unknown'} / {p.platform || 'Unknown'} <span className="text-slate-400 ml-1">({p.ip_address || 'IP Unknown'})</span></p>
                </div>
              </div>

              <div className="flex gap-3 mt-auto">
                {p.foto_selfie && (
                  <img 
                    src={`${BASE_URL}${p.foto_selfie}`} 
                    alt="Selfie" 
                    className="w-16 h-16 rounded-xl object-cover cursor-pointer border border-slate-200"
                    onClick={() => setSelectedPhoto(`${BASE_URL}${p.foto_selfie}`)}
                  />
                )}
                {p.latitude && p.longitude && (
                  <div className="flex-1 h-16 rounded-xl overflow-hidden border border-slate-200 z-0">
                    <MapContainer center={[p.latitude, p.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[p.latitude, p.longitude]} />
                    </MapContainer>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button 
                onClick={() => setActionModal({ id: p.id_absensi, type: 'REJECTED', name: p.user.name })}
                className="flex-1 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-all"
              >
                Tolak
              </button>
              <button 
                onClick={() => setActionModal({ id: p.id_absensi, type: 'APPROVED', name: p.user.name })}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm"
              >
                Setujui
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Action Modal */}
      {actionModal && (
        <Modal 
          title={actionModal.type === 'APPROVED' ? 'Setujui Absensi' : 'Tolak Absensi'} 
          onClose={() => { setActionModal(null); setNote(''); }}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Anda akan <strong className={actionModal.type === 'APPROVED' ? 'text-emerald-600' : 'text-red-600'}>
                {actionModal.type === 'APPROVED' ? 'MENYETUJUI' : 'MENOLAK'}
              </strong> absensi milik <strong>{actionModal.name}</strong>.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Catatan (Opsional)</label>
              <textarea 
                value={note} 
                onChange={e => setNote(e.target.value)}
                placeholder={actionModal.type === 'APPROVED' ? "Misal: Sinyal memang sedang buruk..." : "Misal: Terdeteksi Fake GPS..."}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none resize-none h-24" 
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <button onClick={() => setActionModal(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 text-sm">Batal</button>
              <button 
                onClick={handleAction} 
                disabled={loading}
                className={`flex-1 py-2.5 text-white rounded-xl font-semibold transition-all text-sm disabled:opacity-50 ${actionModal.type === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {loading ? 'Memproses...' : actionModal.type === 'APPROVED' ? 'Ya, Setujui' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </Modal>
      )}

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
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', npm: '', kelas: 'MI 4A' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => { fetchUsers(); }, [filterKelas]);

  const fetchUsers = async () => {
    try {
      let url = `${API}/users`;
      if (filterKelas && filterKelas !== 'Semua Kelas') url += `?kelas=${encodeURIComponent(filterKelas)}`;
      const res = await axios.get(url, { headers: headers() });
      setUsers(res.data);
    } catch {}
  };

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

  const handleSubmit = async () => {
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
      fetchUsers();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Hapus mahasiswa "${user.name}"?\nSeluruh data absensinya juga akan dihapus.`)) return;
    try {
      await axios.delete(`${API}/users/${user.id}`, { headers: headers() });
      setActionMsg('Mahasiswa berhasil dihapus');
      fetchUsers();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus');
    }
  };

  const handleResetPassword = async (user) => {
    if (!confirm(`Reset password "${user.name}" ke NPM (${user.npm})?`)) return;
    try {
      const res = await axios.put(`${API}/users/${user.id}/reset-password`, {}, { headers: headers() });
      setActionMsg(res.data.message);
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal reset password');
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['Semua Kelas', ...CLASSES].map(k => (
            <button
              key={k}
              onClick={() => setFilterKelas(k === 'Semua Kelas' ? '' : k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                (filterKelas === '' && k === 'Semua Kelas') || filterKelas === k
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <button
          id="btn-tambah-mahasiswa"
          onClick={openAdd}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm"
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

      {/* Tabel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-700 text-sm">
            Total: <span className="text-sky-600 font-bold">{users.length}</span> mahasiswa
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nama Mahasiswa</th>
                <th className="px-4 py-3">NPM</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-slate-400">Tidak ada mahasiswa ditemukan.</td>
                </tr>
              ) : users.map((u, i) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{u.name}</div>
                    <div className="text-xs text-slate-400">@{u.username}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-600">{u.npm || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-lg text-xs font-semibold border border-sky-100">
                      {u.kelas || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(u)} className="px-2.5 py-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all font-medium">Edit</button>
                      <button onClick={() => handleResetPassword(u)} className="px-2.5 py-1.5 text-xs text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-all font-medium">Reset PW</button>
                      <button onClick={() => handleDelete(u)} className="px-2.5 py-1.5 text-xs text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all font-medium">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
// TAB PENGATURAN
// ============================================================
function TabSettings() {
  const [form, setForm] = useState({ OFFICE_LAT: '', OFFICE_LON: '', MAX_RADIUS: '', BATAS_TERLAMBAT: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/settings`, { headers: headers() });
      setForm({ OFFICE_LAT: res.data.OFFICE_LAT, OFFICE_LON: res.data.OFFICE_LON, MAX_RADIUS: res.data.MAX_RADIUS, BATAS_TERLAMBAT: res.data.BATAS_TERLAMBAT });
    } catch {}
  };

  const handleSave = async () => {
    setLoading(true); setMsg(''); setError('');
    try {
      const res = await axios.put(`${API}/settings`, form, { headers: headers() });
      setMsg(res.data.message);
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <h3 className="font-bold text-slate-800 text-base mb-1">Lokasi Titik Apel</h3>
          <p className="text-sm text-slate-400">Koordinat lokasi tempat mahasiswa harus berada saat absen.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Latitude</label>
            <input type="number" step="any" value={form.OFFICE_LAT} onChange={e => setForm({ ...form, OFFICE_LAT: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all" placeholder="-5.367235" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Longitude</label>
            <input type="number" step="any" value={form.OFFICE_LON} onChange={e => setForm({ ...form, OFFICE_LON: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all" placeholder="105.226727" />
          </div>
        </div>
        <div className="border-t border-slate-100 pt-5">
          <h3 className="font-bold text-slate-800 text-base mb-1">Radius Absen</h3>
          <p className="text-sm text-slate-400 mb-4">Jarak maksimal mahasiswa dari titik apel agar absen diterima.</p>
          <div className="flex items-center gap-3">
            <input type="number" min="10" max="5000" value={form.MAX_RADIUS} onChange={e => setForm({ ...form, MAX_RADIUS: e.target.value })}
              className="w-40 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all" />
            <span className="text-slate-500 text-sm font-medium">meter</span>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-5">
          <h3 className="font-bold text-slate-800 text-base mb-1">Batas Jam Tepat Waktu</h3>
          <p className="text-sm text-slate-400 mb-4">Mahasiswa yang absen setelah jam ini akan dicatat sebagai TERLAMBAT.</p>
          <div className="flex items-center gap-3">
            <input type="time" value={form.BATAS_TERLAMBAT} onChange={e => setForm({ ...form, BATAS_TERLAMBAT: e.target.value })}
              className="w-40 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all" />
            <span className="text-slate-500 text-sm">WIB</span>
          </div>
        </div>
        {msg && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm font-medium">{msg}</div>}
        {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{error}</div>}
        <div className="flex gap-3 pt-1">
          <button onClick={fetchSettings} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all text-sm">Reset</button>
          <button id="btn-save-settings" onClick={handleSave} disabled={loading}
            className="px-6 py-2.5 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-all text-sm shadow-sm disabled:opacity-50">
            {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>
      <div className="mt-4 p-4 bg-sky-50 border border-sky-100 rounded-2xl">
        <p className="text-sm text-sky-700 font-medium">Catatan Penting</p>
        <p className="text-xs text-sky-600 mt-1">
          Perubahan koordinat dan radius langsung berlaku untuk absensi berikutnya.
          Pastikan koordinat sudah benar sebelum menyimpan. Gunakan Google Maps untuk mendapatkan koordinat yang tepat.
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
  const [stats, setStats] = useState({ totalToday: 0, hadir: 0, terlambat: 0, pending: 0, mencurigakan: 0, byKelas: {}, totalPending: 0 });

  useEffect(() => {
    fetchStats();
  }, [activeTab]); // Refresh stats when tab changes

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/attendance/stats`, { headers: headers() });
      setStats(res.data);
    } catch {}
  };

  const tabs = [
    {
      id: 'absensi', label: 'Data Absensi',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    },
    {
      id: 'verifikasi', label: 'Verifikasi', badge: stats.totalPending,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
            <p className="text-sky-200 text-xs font-medium mb-0.5">Total Absen</p>
            <p className="text-2xl font-bold">{stats.totalToday}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
            <p className="text-emerald-300 text-xs font-medium mb-0.5">Hadir Tepat</p>
            <p className="text-2xl font-bold text-emerald-100">{stats.hadir}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
            <p className="text-amber-300 text-xs font-medium mb-0.5">Pending Review</p>
            <p className="text-2xl font-bold text-amber-100">{stats.pending}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
            <p className="text-orange-300 text-xs font-medium mb-0.5">Mencurigakan</p>
            <p className="text-2xl font-bold text-orange-100">{stats.mencurigakan}</p>
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
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full ${activeTab === tab.id ? 'bg-white text-sky-600' : 'bg-amber-100 text-amber-700'}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'absensi' && <TabAbsensi />}
        {activeTab === 'verifikasi' && <TabVerifikasi onVerified={fetchStats} />}
        {activeTab === 'users' && <TabUsers />}
        {activeTab === 'settings' && <TabSettings />}
      </div>
    </div>
  );
}
