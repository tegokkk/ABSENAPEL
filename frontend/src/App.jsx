import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { useEffect, useState } from 'react';

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
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        {user && (
          <nav className="bg-white shadow-sm border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent leading-tight">
                  Smart Attendance
                </h1>
                <p className="text-xs text-slate-400 leading-tight">Sistem Absensi Digital</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-700">{user.name}</p>
                <p className="text-xs text-slate-400">
                  {user.role === 'ADMIN' ? 'Administrator' : `${user.kelas || 'Mahasiswa'}`}
                </p>
              </div>
              <button
                onClick={handleLogout}
                id="btn-logout"
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all border border-red-100"
              >
                Logout
              </button>
            </div>
          </nav>
        )}
        <main className={user ? 'max-w-7xl mx-auto p-4 md:p-6' : ''}>
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
