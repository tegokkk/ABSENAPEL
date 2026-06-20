import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { useEffect, useState } from 'react';
import { LogOut, UsersRound } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <div className="app-shell">

        {/* Navbar */}
        {user && (
          <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(22,27,34,.92)] backdrop-blur-xl">
            <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:px-5 lg:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent-500/25 bg-accent-500/10 text-accent-400">
                  <UsersRound size={18} strokeWidth={1.9} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold leading-tight text-primary">
                    Smart Attendance
                  </p>
                  <p className="truncate text-[11px] leading-tight text-muted">
                    Sistem Absensi Digital
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
                <div className="hidden min-w-0 text-right sm:block">
                  <p className="max-w-[180px] truncate text-sm font-semibold leading-tight text-primary md:max-w-[260px]">
                    {user.name}
                  </p>
                  <p className="truncate text-[11px] leading-tight text-muted">
                    {user.role === 'ADMIN' ? 'Administrator' : user.kelas || 'Mahasiswa'}
                  </p>
                </div>
                <span
                  className={`hidden rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal sm:inline-flex ${
                    user.role === 'ADMIN'
                      ? 'border border-info-500/20 bg-info-500/10 text-info-500'
                      : 'border border-accent-500/20 bg-accent-500/10 text-accent-400'
                  }`}
                >
                  {user.role === 'ADMIN' ? 'Admin' : 'Mahasiswa'}
                </span>
                <button
                  onClick={handleLogout}
                  id="btn-logout"
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-danger-500/20 bg-danger-500/10 px-3 text-xs font-semibold text-danger-500 transition hover:bg-danger-500/15 active:scale-[.98]"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </nav>
        )}

        {/* Content */}
        <main className={user ? 'app-main' : ''}>
          <Routes>
            <Route
              path="/"
              element={!user
                ? <Login onLogin={handleLogin} />
                : <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} />
              }
            />
            <Route
              path="/dashboard"
              element={user && user.role === 'MAHASISWA'
                ? <UserDashboard user={user} onLogout={handleLogout} />
                : <Navigate to="/" />
              }
            />
            <Route
              path="/admin"
              element={user && user.role === 'ADMIN'
                ? <AdminDashboard />
                : <Navigate to="/" />
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
