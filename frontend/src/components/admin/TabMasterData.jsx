import { useState, useEffect } from 'react';
import { masterDataApi } from '../../services/masterDataApi';

export default function TabMasterData() {
  const [activeSubTab, setActiveSubTab] = useState('Jurusan');
  
  // States
  const [dataJurusan, setDataJurusan] = useState([]);
  const [dataProdi, setDataProdi] = useState([]);
  const [dataKelas, setDataKelas] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [formJurusan, setFormJurusan] = useState({ nama: '', singkatan: '' });
  const [formProdi, setFormProdi] = useState({ nama: '', jurusanId: '' });
  const [formKelas, setFormKelas] = useState({ nama_kelas: '', programStudiId: '' });

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const fetchData = async () => {
    try {
      if (activeSubTab === 'Jurusan') {
        const data = await masterDataApi.getJurusan();
        setDataJurusan(data);
      } else if (activeSubTab === 'Prodi') {
        const data = await masterDataApi.getProgramStudi();
        setDataProdi(data);
        const dataJ = await masterDataApi.getJurusan();
        setDataJurusan(dataJ);
      } else if (activeSubTab === 'Kelas') {
        const data = await masterDataApi.getKelas();
        setDataKelas(data);
        const dataP = await masterDataApi.getProgramStudi();
        setDataProdi(dataP);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddJurusan = async () => {
    try {
      setLoading(true);
      await masterDataApi.createJurusan(formJurusan);
      setFormJurusan({ nama: '', singkatan: '' });
      fetchData();
    } catch (e) { alert("Gagal menambah jurusan"); } finally { setLoading(false); }
  };
  const handleDeleteJurusan = async (id) => {
    if(!confirm("Yakin hapus?")) return;
    try { await masterDataApi.deleteJurusan(id); fetchData(); } catch(e) { alert("Gagal hapus"); }
  }

  const handleAddProdi = async () => {
    try {
      setLoading(true);
      await masterDataApi.createProgramStudi(formProdi);
      setFormProdi({ nama: '', jurusanId: '' });
      fetchData();
    } catch (e) { alert("Gagal menambah prodi"); } finally { setLoading(false); }
  };
  const handleDeleteProdi = async (id) => {
    if(!confirm("Yakin hapus?")) return;
    try { await masterDataApi.deleteProgramStudi(id); fetchData(); } catch(e) { alert("Gagal hapus"); }
  }

  const handleAddKelas = async () => {
    try {
      setLoading(true);
      await masterDataApi.createKelas(formKelas);
      setFormKelas({ nama_kelas: '', programStudiId: '' });
      fetchData();
    } catch (e) { alert("Gagal menambah kelas"); } finally { setLoading(false); }
  };
  const handleDeleteKelas = async (id) => {
    if(!confirm("Yakin hapus?")) return;
    try { await masterDataApi.deleteKelas(id); fetchData(); } catch(e) { alert("Gagal hapus"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['Jurusan', 'Prodi', 'Kelas'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveSubTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeSubTab === tab ? 'bg-sky-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6">
        {activeSubTab === 'Jurusan' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-800">Manajemen Jurusan</h3>
            <div className="flex gap-2 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500">Nama Jurusan</label>
                <input type="text" className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" value={formJurusan.nama} onChange={e => setFormJurusan({...formJurusan, nama: e.target.value})} placeholder="Contoh: Teknologi Informasi" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500">Singkatan</label>
                <input type="text" className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" value={formJurusan.singkatan} onChange={e => setFormJurusan({...formJurusan, singkatan: e.target.value})} placeholder="Contoh: TI" />
              </div>
              <button disabled={loading} onClick={handleAddJurusan} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold h-[38px]">Tambah</button>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100"><tr><th className="px-4 py-2">Nama</th><th className="px-4 py-2">Singkatan</th><th className="px-4 py-2 text-right">Aksi</th></tr></thead>
              <tbody>
                {dataJurusan.map(j => (
                  <tr key={j.id} className="border-b border-slate-50">
                    <td className="px-4 py-2 font-medium">{j.nama}</td><td className="px-4 py-2">{j.singkatan}</td>
                    <td className="px-4 py-2 text-right"><button onClick={() => handleDeleteJurusan(j.id)} className="text-red-500 hover:text-red-700 font-semibold text-xs">Hapus</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'Prodi' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-800">Manajemen Program Studi</h3>
            <div className="flex gap-2 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500">Pilih Jurusan</label>
                <select className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" value={formProdi.jurusanId} onChange={e => setFormProdi({...formProdi, jurusanId: e.target.value})}>
                  <option value="">-- Pilih Jurusan --</option>
                  {dataJurusan.map(j => <option key={j.id} value={j.id}>{j.nama}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500">Nama Prodi</label>
                <input type="text" className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" value={formProdi.nama} onChange={e => setFormProdi({...formProdi, nama: e.target.value})} placeholder="Contoh: Manajemen Informatika" />
              </div>
              <button disabled={loading} onClick={handleAddProdi} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold h-[38px]">Tambah</button>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100"><tr><th className="px-4 py-2">Nama Prodi</th><th className="px-4 py-2">Jurusan</th><th className="px-4 py-2 text-right">Aksi</th></tr></thead>
              <tbody>
                {dataProdi.map(p => (
                  <tr key={p.id} className="border-b border-slate-50">
                    <td className="px-4 py-2 font-medium">{p.nama}</td><td className="px-4 py-2 text-slate-500">{p.jurusan?.nama}</td>
                    <td className="px-4 py-2 text-right"><button onClick={() => handleDeleteProdi(p.id)} className="text-red-500 hover:text-red-700 font-semibold text-xs">Hapus</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'Kelas' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-800">Manajemen Kelas</h3>
            <div className="flex gap-2 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500">Pilih Prodi</label>
                <select className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" value={formKelas.programStudiId} onChange={e => setFormKelas({...formKelas, programStudiId: e.target.value})}>
                  <option value="">-- Pilih Prodi --</option>
                  {dataProdi.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500">Nama Kelas</label>
                <input type="text" className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" value={formKelas.nama_kelas} onChange={e => setFormKelas({...formKelas, nama_kelas: e.target.value})} placeholder="Contoh: MI 4A" />
              </div>
              <button disabled={loading} onClick={handleAddKelas} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold h-[38px]">Tambah</button>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100"><tr><th className="px-4 py-2">Nama Kelas</th><th className="px-4 py-2">Prodi</th><th className="px-4 py-2 text-right">Aksi</th></tr></thead>
              <tbody>
                {dataKelas.map(k => (
                  <tr key={k.id} className="border-b border-slate-50">
                    <td className="px-4 py-2 font-medium">{k.nama_kelas}</td><td className="px-4 py-2 text-slate-500">{k.programStudi?.nama}</td>
                    <td className="px-4 py-2 text-right"><button onClick={() => handleDeleteKelas(k.id)} className="text-red-500 hover:text-red-700 font-semibold text-xs">Hapus</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
