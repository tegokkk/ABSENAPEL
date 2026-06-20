import { useState, useEffect } from 'react';
import { izinApi } from '../../services/izinApi';

export default function TabIzin() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await izinApi.getIzins();
      setData(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (!confirm(`Yakin ingin mengubah status menjadi ${status}?`)) return;
    try {
      await izinApi.updateStatus(id, status);
      fetchData();
    } catch(e) {
      const msg = e.response?.data?.error || e.response?.data?.message || e.message || 'Gagal update status';
      alert(`Gagal update status: ${msg}`);
    }
  };


  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6 space-y-4">
        <h3 className="font-bold text-lg text-slate-800">Validasi Pengajuan Izin</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left mt-2">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3">Mahasiswa</th>
                <th className="px-4 py-3">Tanggal Izin</th>
                <th className="px-4 py-3">Jenis & Keterangan</th>
                <th className="px-4 py-3">Lampiran</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map(i => (
                <tr key={i.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{i.user?.name}</div>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="text-xs font-mono text-slate-400">{i.user?.npm || '-'}</span>
                      <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded text-[10px] font-bold border border-sky-100">
                        {i.user?.kelas || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {new Date(i.tanggal_awal).toLocaleDateString('id-ID')} - {new Date(i.tanggal_akhir).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-700">{i.jenis_izin}</span>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{i.keterangan}</p>
                  </td>
                  <td className="px-4 py-3">
                    {i.lampiran_url ? (
                      <button onClick={() => setSelectedImage(i.lampiran_url)} className="text-xs text-sky-600 font-medium hover:underline">Lihat Gambar</button>
                    ) : <span className="text-xs text-slate-400">Tidak ada</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadge(i.status)}`}>
                      {i.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {i.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleUpdateStatus(i.id, 'APPROVED')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-xs font-bold transition-all">Setuju</button>
                        <button onClick={() => handleUpdateStatus(i.id, 'REJECTED')} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-bold transition-all">Tolak</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan="6" className="text-center py-6 text-slate-400">Belum ada pengajuan izin</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Lampiran" className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl border-4 border-white" />
        </div>
      )}
    </div>
  );
}
