import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Camera, Eye, EyeOff, FileSpreadsheet, Loader2, Lock, LogIn, MapPinned, ShieldCheck, User } from 'lucide-react';
import { useButtonGuard } from '../hooks/useDebounce';
import { authApi } from '../services/authApi';
import heroImage from '../assets/hero.png';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isLocked, guardTrigger] = useButtonGuard(1500);

  const _doLogin = useCallback(async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await authApi.login({
        username: username.trim(),
        password: password.trim(),
      });
      localStorage.setItem('token', data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [username, password, onLogin]);

  const handleSubmit = guardTrigger(_doLogin);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.09 } },
  };

  const item = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[var(--bg-base)] px-4 py-6 sm:px-6 lg:px-8">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto grid min-h-[calc(100dvh-3rem)] w-full max-w-6xl grid-cols-1 items-center gap-6 lg:grid-cols-[1.08fr_.92fr]"
      >
        <motion.section
          variants={item}
          className="surface-hero relative hidden min-h-[560px] overflow-hidden rounded-xl p-8 lg:flex lg:flex-col lg:justify-between"
        >
          <img
            src={heroImage}
            alt="Dashboard Smart Attendance"
            className="absolute inset-y-0 right-0 h-full w-[58%] object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,17,23,.98)_0%,rgba(13,17,23,.88)_44%,rgba(13,17,23,.42)_100%)]" />

          <div className="relative inline-flex h-12 w-12 items-center justify-center rounded-xl border border-accent-500/25 bg-accent-500/10 text-accent-400 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
            <ShieldCheck size={24} strokeWidth={1.8} />
          </div>

          <div className="relative max-w-xl">
            <p className="mb-3 text-sm font-semibold uppercase text-accent-300">Absensi Apel MI Polinela</p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-primary">
              Presensi apel dengan bukti lokasi dan wajah.
            </h1>
            <p className="mt-4 max-w-[54ch] text-base leading-relaxed text-secondary">
              Mahasiswa absen dengan GPS dan selfie langsung, admin memantau rekap kelas, izin, jadwal, dan titik apel dari satu dashboard.
            </p>
          </div>

          <div className="relative grid grid-cols-[1.15fr_.85fr] gap-3">
            {[
              ['Radius GPS', 'Validasi titik apel', MapPinned],
              ['Selfie langsung', 'Bukti kehadiran', Camera],
              ['Rekap instan', 'Export PDF/Excel', FileSpreadsheet],
              ['Role aman', 'Admin dan mahasiswa', User],
            ].map(([label, desc, Icon]) => (
              <div key={label} className="surface-soft rounded-lg p-3">
                <Icon size={16} className="mb-2 text-accent-400" />
                <p className="text-xs font-semibold text-primary">{label}</p>
                <p className="mt-1 text-[11px] leading-snug text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section variants={item} className="mx-auto w-full max-w-md">
          <div className="mb-6 text-left lg:hidden">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-accent-500/25 bg-accent-500/10 text-accent-400">
              <User size={23} strokeWidth={1.8} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Smart Attendance</h1>
            <p className="mt-1 text-sm text-secondary">Sistem Absensi Digital - Manajemen Informatika</p>
          </div>

          <div className="section-card space-y-5 p-5 shadow-modal sm:p-6">
            <div>
              <h2 className="text-base font-bold text-primary">Masuk ke akun</h2>
              <p className="mt-1 text-sm text-secondary">Gunakan username admin atau NPM mahasiswa.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="form-label" htmlFor="input-username">Username</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="input-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nama lengkap atau username admin"
                    className="form-input login-input-with-icon"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="form-label" htmlFor="input-password">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="input-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="NPM mahasiswa / password admin"
                    className="form-input login-input-password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted transition hover:bg-white/5 hover:text-secondary"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 rounded-lg border border-danger-500/20 bg-danger-500/10 p-3 text-sm text-danger-500"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                id="btn-login"
                type="submit"
                disabled={loading || isLocked}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-600 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Memverifikasi...</>
                ) : (
                  <><LogIn size={16} /> Masuk</>
                )}
              </button>
            </form>
          </div>

          <motion.p variants={item} className="mt-5 text-center text-xs text-muted">
            (c) 2024 Smart Attendance - Politeknik Negeri Lampung
          </motion.p>
        </motion.section>
      </motion.div>
    </div>
  );
}
