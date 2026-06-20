import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, BookOpen, GraduationCap, Users } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Table, { EmptyRow } from '../ui/Table';
import { masterDataApi } from '../../services/masterDataApi';
import { useButtonGuard } from '../../hooks/useDebounce';

const SUB_TABS = ['Jurusan', 'Prodi', 'Kelas'];

export default function TabMasterData() {
  const [activeSubTab, setActiveSubTab] = useState('Jurusan');
  const [dataJurusan, setDataJurusan] = useState([]);
  const [dataProdi, setDataProdi] = useState([]);
  const [dataKelas, setDataKelas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formJurusan, setFormJurusan] = useState({ nama: '', singkatan: '' });
  const [formProdi, setFormProdi] = useState({ nama: '', jurusanId: '' });
  const [formKelas, setFormKelas] = useState({ nama_kelas: '', programStudiId: '' });
  const [, guardAction] = useButtonGuard(1200);

  const fetchData = useCallback(async () => {
    try {
      if (activeSubTab === 'Jurusan') {
        setDataJurusan(await masterDataApi.getJurusan());
      } else if (activeSubTab === 'Prodi') {
        setDataProdi(await masterDataApi.getProgramStudi());
        setDataJurusan(await masterDataApi.getJurusan());
      } else if (activeSubTab === 'Kelas') {
        setDataKelas(await masterDataApi.getKelas());
        setDataProdi(await masterDataApi.getProgramStudi());
      }
    } catch (error) { console.error(error); }
  }, [activeSubTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddJurusan = guardAction(async () => {
    try { setLoading(true); await masterDataApi.createJurusan(formJurusan); setFormJurusan({ nama: '', singkatan: '' }); fetchData(); }
    catch { alert('Gagal menambah jurusan'); } finally { setLoading(false); }
  });
  const handleDeleteJurusan = guardAction(async (id) => {
    if (!confirm('Yakin hapus?')) return;
    try { await masterDataApi.deleteJurusan(id); fetchData(); } catch { alert('Gagal hapus'); }
  });

  const handleAddProdi = guardAction(async () => {
    try { setLoading(true); await masterDataApi.createProgramStudi(formProdi); setFormProdi({ nama: '', jurusanId: '' }); fetchData(); }
    catch { alert('Gagal menambah prodi'); } finally { setLoading(false); }
  });
  const handleDeleteProdi = guardAction(async (id) => {
    if (!confirm('Yakin hapus?')) return;
    try { await masterDataApi.deleteProgramStudi(id); fetchData(); } catch { alert('Gagal hapus'); }
  });

  const handleAddKelas = guardAction(async () => {
    try { setLoading(true); await masterDataApi.createKelas(formKelas); setFormKelas({ nama_kelas: '', programStudiId: '' }); fetchData(); }
    catch { alert('Gagal menambah kelas'); } finally { setLoading(false); }
  });
  const handleDeleteKelas = guardAction(async (id) => {
    if (!confirm('Yakin hapus?')) return;
    try { await masterDataApi.deleteKelas(id); fetchData(); } catch { alert('Gagal hapus'); }
  });

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {SUB_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`tab-pill whitespace-nowrap ${activeSubTab === tab ? 'active' : ''}`}
            >
              {tab === 'Jurusan' && <BookOpen size={14} />}
              {tab === 'Prodi' && <GraduationCap size={14} />}
              {tab === 'Kelas' && <Users size={14} />}
              {tab}
            </button>
          ))}
        </div>
      </Card>

      {activeSubTab === 'Jurusan' && (
        <Card>
          <CardHeader title="Manajemen Jurusan" />
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                label="Nama Jurusan"
                value={formJurusan.nama}
                onChange={(e) => setFormJurusan({ ...formJurusan, nama: e.target.value })}
                placeholder="Contoh: Teknologi Informasi"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <Input
                label="Singkatan"
                value={formJurusan.singkatan}
                onChange={(e) => setFormJurusan({ ...formJurusan, singkatan: e.target.value })}
                placeholder="Contoh: TI"
              />
            </div>
            <Button variant="success" loading={loading} onClick={handleAddJurusan}>
              <Plus size={16} /> Tambah
            </Button>
          </div>
          <Table
            headers={[
              { label: 'Nama' },
              { label: 'Singkatan' },
              { label: 'Aksi', align: 'right' },
            ]}
          >
            {dataJurusan.map((j) => (
              <tr key={j.id}>
                <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{j.nama}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{j.singkatan}</td>
                <td className="text-right">
                  <Button variant="danger" size="sm" onClick={() => handleDeleteJurusan(j.id)}>
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
            {dataJurusan.length === 0 && <EmptyRow colSpan={3} />}
          </Table>
        </Card>
      )}

      {activeSubTab === 'Prodi' && (
        <Card>
          <CardHeader title="Manajemen Program Studi" />
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Select
                label="Pilih Jurusan"
                value={formProdi.jurusanId}
                onChange={(e) => setFormProdi({ ...formProdi, jurusanId: e.target.value })}
              >
                <option value="">-- Pilih Jurusan --</option>
                {dataJurusan.map((j) => (
                  <option key={j.id} value={j.id}>{j.nama}</option>
                ))}
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Input
                label="Nama Prodi"
                value={formProdi.nama}
                onChange={(e) => setFormProdi({ ...formProdi, nama: e.target.value })}
                placeholder="Contoh: Manajemen Informatika"
              />
            </div>
            <Button variant="success" loading={loading} onClick={handleAddProdi}>
              <Plus size={16} /> Tambah
            </Button>
          </div>
          <Table
            headers={[
              { label: 'Nama Prodi' },
              { label: 'Jurusan' },
              { label: 'Aksi', align: 'right' },
            ]}
          >
            {dataProdi.map((p) => (
              <tr key={p.id}>
                <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.nama}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{p.jurusan?.nama}</td>
                <td className="text-right">
                  <Button variant="danger" size="sm" onClick={() => handleDeleteProdi(p.id)}>
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
            {dataProdi.length === 0 && <EmptyRow colSpan={3} />}
          </Table>
        </Card>
      )}

      {activeSubTab === 'Kelas' && (
        <Card>
          <CardHeader title="Manajemen Kelas" />
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Select
                label="Pilih Prodi"
                value={formKelas.programStudiId}
                onChange={(e) => setFormKelas({ ...formKelas, programStudiId: e.target.value })}
              >
                <option value="">-- Pilih Prodi --</option>
                {dataProdi.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Input
                label="Nama Kelas"
                value={formKelas.nama_kelas}
                onChange={(e) => setFormKelas({ ...formKelas, nama_kelas: e.target.value })}
                placeholder="Contoh: MI 4A"
              />
            </div>
            <Button variant="success" loading={loading} onClick={handleAddKelas}>
              <Plus size={16} /> Tambah
            </Button>
          </div>
          <Table
            headers={[
              { label: 'Nama Kelas' },
              { label: 'Prodi' },
              { label: 'Aksi', align: 'right' },
            ]}
          >
            {dataKelas.map((k) => (
              <tr key={k.id}>
                <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{k.nama_kelas}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{k.programStudi?.nama}</td>
                <td className="text-right">
                  <Button variant="danger" size="sm" onClick={() => handleDeleteKelas(k.id)}>
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
            {dataKelas.length === 0 && <EmptyRow colSpan={3} />}
          </Table>
        </Card>
      )}
    </div>
  );
}
