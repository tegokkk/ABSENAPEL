import { useState, useEffect } from 'react';
import { jadwalApi } from '../../services/jadwalApi';

export default function TabJadwal() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nama_kegiatan: '', waktu_mulai: '', waktu_selesai: '', deskripsi: '', is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await jadwalApi.getJadwal();
      setData(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAdd = async () => {
    try {
      setLoading(true);
      await jadwalApi.createJadwal(form);
      setForm({ nama_kegiatan: '', waktu_mulai: '', waktu_selesai: '', deskripsi: '', is_active: true });
      fetchData();
    } catch (e) { alert("Gagal menambah jadwal"); } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if(!confirm("Yakin hapus jadwal ini?")) return;
    try { await jadwalApi.deleteJadwal(id); fetchData(); } catch(e) { alert("Gagal hapus"); }
  };

  const handleToggleActive = async (jadwal) => {
    try {
      await jadwalApi.updateJadwal(jadwal.id, { is_active: !jadwal.is_active });
      fetchData();
    } catch(e) { alert("Gagal update status"); }
  };

  const formatLocalTime = (isoString) => {
    if (!isoString) return '-';
    // Gunakan 'datetime-local' format
    const d = new Date(isoString);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6 space-y-4">
        <h3 className="font-bold text-lg text-slate-800">Manajemen Jadwal Apel</h3>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500">Nama Kegiatan</label>
              <input type="text" className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" value={form.nama_kegiatan} onChange={e => setForm({...form, nama_kegiatan: e.target.value})} placeholder="Contoh: Apel Pagi" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Deskripsi</label>
              <input type="text" className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" value={form.deskripsi} onChange={e => setForm({...form, deskripsi: e.target.value})} placeholder="Opsional" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Waktu Mulai</label>
              <input type="datetime-local" className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" value={form.waktu_mulai} onChange={e => setForm({...form, waktu_mulai: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Waktu Selesai</label>
              <input type="datetime-local" className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" value={form.waktu_selesai} onChange={e => setForm({...form, waktu_selesai: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end">
            <button disabled={loading} onClick={handleAdd} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm">Tambah Jadwal</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left mt-4">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3">Kegiatan</th>
                <th className="px-4 py-3">Waktu Mulai</th>
                <th className="px-4 py-3">Waktu Selesai</th>
                <th className="px-4 py-3 text-center">Status Aktif</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map(j => {
                const now = new Date();
                const start = new Date(j.waktu_mulai);
                const end = new Date(j.waktu_selesai);
                const isOngoing = j.is_active && now >= start && now <= end;

                return (
                  <tr key={j.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{j.nama_kegiatan}</div>
                      <div className="text-xs text-slate-500">{j.deskripsi || '-'}</div>
                      {isOngoing && <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded text-[10px] font-bold animate-pulse">SEDANG BERLANGSUNG</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{new Date(j.waktu_mulai).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{new Date(j.waktu_selesai).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggleActive(j)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${j.is_active ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}>
                        {j.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(j.id)} className="text-red-500 hover:text-red-700 font-semibold text-xs">Hapus</button>
                    </td>
                  </tr>
                );
              })}
              {data.length === 0 && <tr><td colSpan="5" className="text-center py-6 text-slate-400">Belum ada jadwal</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
