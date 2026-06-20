import { useState, useEffect, useRef, useCallback } from 'react';
import { attendanceApi } from '../services/attendanceApi';
import { izinApi } from '../services/izinApi';
import { settingsApi } from '../services/settingsApi';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Webcam from 'react-webcam';
import L from 'leaflet';
import { useDebounceCallback, useButtonGuard } from '../hooks/useDebounce';




// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper: Parse browser & platform dari userAgent
function parseBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/')) browser = 'Safari';

  let platform = 'Unknown';
  if (/Android/i.test(ua)) platform = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) platform = 'iOS';
  else if (/Windows/i.test(ua)) platform = 'Windows';
  else if (/Mac/i.test(ua)) platform = 'macOS';
  else if (/Linux/i.test(ua)) platform = 'Linux';

  return { browser, platform };
}

export default function UserDashboard({ user }) {
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [attendances, setAttendances] = useState([]);
  const [izins, setIzins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [settings, setSettings] = useState({ OFFICE_LAT: -5.367235, OFFICE_LON: 105.226727, MAX_RADIUS: 100, BATAS_TERLAMBAT: '08:00' });

  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);

  // Guard: cegah double-absen
  const [absenLocked, guardAbsen] = useButtonGuard(3000);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) setImgSrc(imageSrc);
  }, [webcamRef]);

  const fetchSettings = async () => {
    try {
      const data = await settingsApi.getSettings();
      setSettings(data);
    } catch {}
  };

  const [showIzinModal, setShowIzinModal] = useState(false);
  const [formIzin, setFormIzin] = useState({ tanggal_awal: '', tanggal_akhir: '', jenis_izin: 'Sakit', keterangan: '', lampiran_url: null });
  const [lampiranPreview, setLampiranPreview] = useState(null);
  const [izinLoading, setIzinLoading] = useState(false);

  const handleLampiranChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormIzin(prev => ({ ...prev, lampiran_url: reader.result }));
      setLampiranPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const fetchIzins = async () => {
    try {
      const data = await izinApi.getIzins();
      setIzins(data);
    } catch {}
  };

  const submitIzin = async () => {
    if (!formIzin.tanggal_awal || !formIzin.tanggal_akhir || !formIzin.keterangan) {
      alert("Semua field harus diisi!"); return;
    }
    try {
      setIzinLoading(true);
      await izinApi.createIzin(formIzin);
      setShowIzinModal(false);
      setFormIzin({ tanggal_awal: '', tanggal_akhir: '', jenis_izin: 'Sakit', keterangan: '', lampiran_url: null });
      setLampiranPreview(null);
      fetchIzins();
      alert("Pengajuan izin berhasil dibuat");
    } catch(e) {
      alert("Gagal mengajukan izin");
    } finally {
      setIzinLoading(false);
    }
  };

  const _getLocationRaw = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak didukung oleh browser ini.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,   // Timestamp GPS
        });
        setLocationError('');
      },
      () => setLocationError('Gagal mendapatkan lokasi. Pastikan izin lokasi aktif.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Debounce 800ms — cegah spam klik Perbarui Lokasi
  const getLocation = useDebounceCallback(_getLocationRaw, 800);

  const fetchAttendances = async () => {
    try {
      const data = await attendanceApi.getAttendance();
      setAttendances(data);
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    }
  };

  useEffect(() => {
    fetchAttendances();
    fetchIzins();
    getLocation();
    fetchSettings();
  }, []);



  const _doAbsen = async () => {
    if (!location) {
      setMessage({ type: 'error', text: 'Lokasi belum ditemukan! Klik "Perbarui Lokasi".' });
      return;
    }
    if (!imgSrc) {
      setMessage({ type: 'error', text: 'Silakan ambil foto selfie terlebih dahulu!' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const { browser, platform } = parseBrowserInfo();

      const payload = {
        latitude: location.lat,
        longitude: location.lng,
        accuracy: location.accuracy ?? null,
        gps_timestamp: location.timestamp ?? null,
        browser,
        platform,
        device_info: navigator.userAgent,
        foto_selfie: imgSrc,
      };

      const res = await attendanceApi.submitApel(payload);

      const status = res.data.status;
      setMessage({
        type: 'success',
        text: status === 'TERLAMBAT'
          ? 'Absen berhasil dicatat, namun Anda TERLAMBAT.'
          : 'Absen Apel berhasil! Tepat waktu.'
      });
      fetchAttendances();
      setImgSrc(null);
    } catch (err) {
      const data = err.response?.data || {};
      const errMsg = data.message || data.error || 'Terjadi kesalahan pada server';
      let fullMsg = errMsg;
      if (data.distance != null && data.allowedRadius != null) {
        fullMsg = `Anda berada di luar area lokasi apel. Jarak Anda saat ini: ${data.distance} meter dari titik apel.`;
      }
      setMessage({ type: 'error', text: fullMsg });
    } finally {
      setLoading(false);
    }
  };

  // Bungkus dengan guard 3 detik — cegah double-submit absen
  const handleAbsenApel = guardAbsen(_doAbsen);

  const todayRecord = attendances.find(a => {
    const d = new Date(a.tanggal);
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  });

  const officeCoord = [settings.OFFICE_LAT, settings.OFFICE_LON];

  // Status badge color helper
  const getStatusBadge = (status) => {
    if (status === 'TERLAMBAT') return { bg: 'bg-orange-100 text-orange-700 border border-orange-200', label: 'Terlambat' };
    return { bg: 'bg-emerald-100 text-emerald-700 border border-emerald-200', label: 'Hadir' };
  };

  const getTodayBadge = () => {
    if (!todayRecord) return null;
    if (todayRecord.status === 'TERLAMBAT') return { bg: 'bg-orange-400/30 text-orange-100', label: 'Terlambat' };
    return { bg: 'bg-green-400/30 text-green-100', label: 'Hadir Hari Ini' };
  };

  const todayBadge = getTodayBadge();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ===== KOLOM KIRI ===== */}
      <div className="lg:col-span-1 space-y-5">

        {/* Info Pengguna */}
        <div className="bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-bold leading-tight">{user.name}</h2>
            <p className="text-sky-100 text-sm mt-1">NPM: <span className="font-mono font-semibold text-white">{user.npm || '-'}</span></p>
            <div className="mt-3 flex gap-2 flex-wrap">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm">
                {user.kelas || '-'}
              </span>
              {todayBadge && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${todayBadge.bg}`}>
                  {todayBadge.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Kamera Selfie */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-slate-800">
            <span className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </span>
            Verifikasi Wajah
          </h2>
          <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video mb-4 border border-slate-200">
            {!imgSrc ? (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                videoConstraints={{ facingMode: 'user' }}
              />
            ) : (
              <img src={imgSrc} alt="Selfie" className="w-full h-full object-cover" />
            )}
          </div>
          {!imgSrc ? (
            <button
              id="btn-capture"
              onClick={capture}
              className="w-full py-2.5 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-all text-sm flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
              </svg>
              Ambil Foto
            </button>
          ) : (
            <button
              id="btn-retake"
              onClick={() => setImgSrc(null)}
              className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all text-sm"
            >
              Ulangi Foto
            </button>
          )}
        </div>

        {/* Aksi Absensi */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-base font-bold mb-4 text-slate-800">Aksi Absensi</h2>

          {message.text && (
            <div className={`p-3 rounded-xl mb-4 text-sm flex items-start gap-2 ${
              message.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-100'
                : message.type === 'warning'
                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}>
              {message.text}
            </div>
          )}

          <button
            id="btn-absen-apel"
            onClick={handleAbsenApel}
            disabled={loading || !!todayRecord || absenLocked}
            className={`w-full py-5 rounded-2xl font-semibold text-base transition-all flex flex-col items-center gap-2 border ${todayRecord
              ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
              : 'bg-gradient-to-br from-sky-500 to-blue-600 text-white border-transparent hover:from-sky-400 hover:to-blue-500 shadow-lg shadow-sky-200'
            } ${(loading || absenLocked) ? 'opacity-60' : ''}`}
          >
            {loading ? (
              <svg className="animate-spin w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : todayRecord ? (
              <>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Sudah Absen Hari Ini
              </>
            ) : (
              <>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Absen Apel
              </>
            )}
          </button>

          {!todayRecord && (
            <p className="text-xs text-slate-400 text-center mt-2">
              Batas tepat waktu: <span className="font-semibold text-slate-600">{settings.BATAS_TERLAMBAT} WIB</span>
            </p>
          )}

          {/* Info accuracy */}
          {location && (
            <div className="mt-3 p-2.5 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500">
                Akurasi GPS: <span className={`font-semibold ${location.accuracy > 100 ? 'text-red-600' : location.accuracy > 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {location.accuracy ? `±${location.accuracy.toFixed(0)}m` : 'N/A'}
                </span>
                {location.accuracy > 100 && <span className="text-red-500 ml-1">(terlalu rendah, mungkin masuk verifikasi)</span>}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===== KOLOM KANAN ===== */}
      <div className="lg:col-span-2 space-y-5">

        {/* Peta Lokasi */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold flex items-center gap-2 text-slate-800">
              <span className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              </span>
              Lokasi Saat Ini
            </h2>
            <button
              id="btn-refresh-location"
              onClick={getLocation}
              className="text-xs text-sky-600 font-semibold hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg transition-all"
            >
              Perbarui
            </button>
          </div>

          {locationError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {locationError}
            </div>
          )}

          <div className="h-64 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative z-0">
            {location ? (
              <MapContainer center={[location.lat, location.lng]} zoom={16} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[location.lat, location.lng]}>
                  <Popup>Lokasi Anda</Popup>
                </Marker>
                <Circle center={officeCoord} pathOptions={{ color: '#0284c7', fillColor: '#0284c7', fillOpacity: 0.15 }} radius={settings.MAX_RADIUS} />
                <Marker position={officeCoord}>
                  <Popup>Lokasi Apel</Popup>
                </Marker>
              </MapContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span className="text-sm">Memuat lokasi...</span>
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-2.5 text-center">
              <p className="text-xs text-slate-400 mb-0.5">Latitude</p>
              <p className="text-xs font-mono font-semibold text-slate-700">{location?.lat?.toFixed(6) || '-'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 text-center">
              <p className="text-xs text-slate-400 mb-0.5">Longitude</p>
              <p className="text-xs font-mono font-semibold text-slate-700">{location?.lng?.toFixed(6) || '-'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 text-center">
              <p className="text-xs text-slate-400 mb-0.5">Akurasi</p>
              <p className="text-xs font-mono font-semibold text-slate-700">{location?.accuracy ? `±${location.accuracy.toFixed(0)}m` : '-'}</p>
            </div>
          </div>
        </div>

        {/* Riwayat Absensi */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-slate-800">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </span>
            Riwayat Absensi
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-tl-xl">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Waktu Absen</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold rounded-tr-xl">Foto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {attendances.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-slate-400">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-slate-200">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Belum ada riwayat absensi.
                    </td>
                  </tr>
                ) : (
                  attendances.map(a => {
                    const badge = getStatusBadge(a.status);
                    return (
                      <tr key={a.id_absensi} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {new Date(a.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 text-xs">
                          {a.jam_absen ? new Date(a.jam_absen).toLocaleTimeString('id-ID') : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {a.foto_selfie ? (
                            <a href={a.foto_selfie} target="_blank" rel="noopener noreferrer">
                              <img
                                src={a.foto_selfie}
                                alt="Selfie"
                                className="w-10 h-10 rounded-xl object-cover border-2 border-slate-200 hover:border-sky-400 hover:scale-110 transition-all cursor-pointer shadow-sm"
                              />
                            </a>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Riwayat Izin */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mt-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold flex items-center gap-2 text-slate-800">
              <span className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
              </span>
              Pengajuan Izin
            </h2>
            <button onClick={() => setShowIzinModal(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all">Ajukan Izin</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-tl-xl">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Jenis</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {izins.length === 0 ? (
                  <tr><td colSpan="3" className="px-4 py-6 text-center text-slate-400">Belum ada riwayat izin.</td></tr>
                ) : izins.map(i => (
                  <tr key={i.id}>
                    <td className="px-4 py-3 font-medium text-slate-700 text-xs">
                      {new Date(i.tanggal_awal).toLocaleDateString('id-ID')} - {new Date(i.tanggal_akhir).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{i.jenis_izin}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        i.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                        i.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {i.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showIzinModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 pb-8 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 my-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Form Pengajuan Izin</h3>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mulai Tanggal</label>
                  <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={formIzin.tanggal_awal} onChange={e => setFormIzin({...formIzin, tanggal_awal: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sampai Tanggal</label>
                  <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={formIzin.tanggal_akhir} onChange={e => setFormIzin({...formIzin, tanggal_akhir: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Izin</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={formIzin.jenis_izin} onChange={e => setFormIzin({...formIzin, jenis_izin: e.target.value})}>
                  <option value="Sakit">Sakit</option>
                  <option value="Izin">Izin (Keperluan Lain)</option>
                  <option value="Surat Tugas">Surat Tugas / Kegiatan Kampus</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Keterangan / Alasan</label>
                <textarea rows="2" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Berikan keterangan jelas" value={formIzin.keterangan} onChange={e => setFormIzin({...formIzin, keterangan: e.target.value})}></textarea>
              </div>

              {/* Upload Bukti */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Bukti Pendukung
                  <span className="ml-1 text-slate-400 font-normal">(Surat sakit, surat tugas, dll.)</span>
                </label>
                <label
                  htmlFor="upload-lampiran"
                  className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer transition-all group"
                >
                  {lampiranPreview ? (
                    <div className="relative w-full h-full flex items-center justify-center p-2">
                      <img src={lampiranPreview} alt="Preview lampiran" className="max-h-24 max-w-full object-contain rounded-lg shadow-sm" />
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setLampiranPreview(null); setFormIzin(p => ({...p, lampiran_url: null})); }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold hover:bg-red-600"
                      >✕</button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-indigo-400 group-hover:text-indigo-600 transition-colors">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span className="text-xs font-medium">Klik untuk upload foto / gambar</span>
                      <span className="text-[10px] text-indigo-300">JPG, PNG, maks. 5MB</span>
                    </div>
                  )}
                </label>
                <input
                  id="upload-lampiran"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLampiranChange}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => { setShowIzinModal(false); setLampiranPreview(null); setFormIzin({ tanggal_awal: '', tanggal_akhir: '', jenis_izin: 'Sakit', keterangan: '', lampiran_url: null }); }} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold">Batal</button>
                <button disabled={izinLoading} onClick={submitIzin} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                  {izinLoading ? 'Mengirim...' : 'Ajukan Izin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
