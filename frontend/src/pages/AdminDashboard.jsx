import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, FileText, Clock, Users, Settings2, Grid3X3, BarChart3, Activity, ShieldCheck, UserX, Trophy, ClipboardList, TrendingUp } from 'lucide-react';
import { attendanceApi } from '../services/attendanceApi';
import { usersApi } from '../services/usersApi';
import { izinApi } from '../services/izinApi';
import TabIzin from '../components/admin/TabIzin';
import { ConfirmDialog, ToastViewport } from '../components/ui/Feedback';
import { useConfirmDialog, useToasts } from '../hooks/useUiFeedback';
import TabAbsensi from '../components/admin/TabAbsensi';
import TabUsers from '../components/admin/TabUsers';
import TabSettings from '../components/admin/TabSettings';
import { CLASSES } from '../utils/academic';
import { formatWibDate, isSameWibDay } from '../utils/dateTime';

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

      const todayAttendances = attendances.filter((item) => isSameWibDay(item.tanggal));
      const attendedUserIds = new Set(todayAttendances.map((item) => item.userId ?? item.user?.id ?? item.user_id));
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
        const date = new Date(Date.now() - (6 - index) * 86400000);
        const dayItems = attendances.filter((item) => isSameWibDay(item.tanggal, date));
        return {
          label: formatWibDate(date, { day: '2-digit', month: 'short' }),
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
