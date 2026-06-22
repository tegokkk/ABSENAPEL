import { useState, useEffect, useRef, useCallback } from 'react';
import { attendanceApi } from '../services/attendanceApi';
import { izinApi } from '../services/izinApi';
import { settingsApi } from '../services/settingsApi';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Webcam from 'react-webcam';
import L from 'leaflet';
import { useDebounceCallback, useButtonGuard } from '../hooks/useDebounce';
import {
  Camera,
  RotateCcw,
  CheckCircle2,
  CalendarCheck,
  MapPin,
  Crosshair,
  AlertCircle,
  FileText,
  Upload,
  X,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Table, { EmptyRow } from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
  const [settings, setSettings] = useState({
    OFFICE_LAT: -5.367235,
    OFFICE_LON: 105.226727,
    MAX_RADIUS: 100,
    BATAS_TERLAMBAT: '08:00',
  });

  const webcamRef = useRef(null);
  const captureLockRef = useRef(false);
  const [imgSrc, setImgSrc] = useState(null);
  const [captureLocked, setCaptureLocked] = useState(false);

  const [absenLocked, guardAbsen] = useButtonGuard(3000);
  const [, guardIzin] = useButtonGuard(1500);

  const capture = useCallback(() => {
    if (captureLockRef.current) return;
    captureLockRef.current = true;
    setCaptureLocked(true);
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) setImgSrc(imageSrc);
    setTimeout(() => {
      captureLockRef.current = false;
      setCaptureLocked(false);
    }, 800);
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await settingsApi.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings', error);
    }
  }, []);

  const [showIzinModal, setShowIzinModal] = useState(false);
  const [formIzin, setFormIzin] = useState({
    tanggal_awal: '',
    tanggal_akhir: '',
    jenis_izin: 'Sakit',
    keterangan: '',
    lampiran_url: null,
  });
  const [lampiranPreview, setLampiranPreview] = useState(null);
  const [izinLoading, setIzinLoading] = useState(false);

  const handleLampiranChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormIzin((prev) => ({ ...prev, lampiran_url: reader.result }));
      setLampiranPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const fetchIzins = useCallback(async () => {
    try {
      const data = await izinApi.getIzins();
      setIzins(data);
    } catch (error) {
      console.error('Failed to fetch izin data', error);
    }
  }, []);

  const submitIzin = guardIzin(async () => {
    if (!formIzin.tanggal_awal || !formIzin.tanggal_akhir || !formIzin.keterangan) {
      alert('Semua field harus diisi!');
      return;
    }
    try {
      setIzinLoading(true);
      await izinApi.createIzin(formIzin);
      setShowIzinModal(false);
      setFormIzin({
        tanggal_awal: '',
        tanggal_akhir: '',
        jenis_izin: 'Sakit',
        keterangan: '',
        lampiran_url: null,
      });
      setLampiranPreview(null);
      fetchIzins();
      alert('Pengajuan izin berhasil dibuat');
    } catch {
      alert('Gagal mengajukan izin');
    } finally {
      setIzinLoading(false);
    }
  });

  const _getLocationRaw = useCallback(() => {
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
          timestamp: position.timestamp,
        });
        setLocationError('');
      },
      () => setLocationError('Gagal mendapatkan lokasi. Pastikan izin lokasi aktif.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  const getLocation = useDebounceCallback(_getLocationRaw, 800);

  const fetchAttendances = useCallback(async () => {
    try {
      const data = await attendanceApi.getAttendance();
      setAttendances(data);
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    }
  }, []);

  useEffect(() => {
    fetchAttendances();
    fetchIzins();
    getLocation();
    fetchSettings();
  }, [fetchAttendances, fetchIzins, fetchSettings, getLocation]);

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
        text:
          status === 'TERLAMBAT'
            ? 'Absen berhasil dicatat, namun Anda TERLAMBAT.'
            : 'Absen Apel berhasil! Tepat waktu.',
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

  const handleAbsenApel = guardAbsen(_doAbsen);

  const todayRecord = attendances.find((a) => {
    const d = new Date(a.tanggal);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });

  const officeCoord = [settings.OFFICE_LAT, settings.OFFICE_LON];

  const todayBadgeVariant = todayRecord
    ? todayRecord.status === 'TERLAMBAT' ? 'warning' : 'success'
    : null;

  const getBadgeVariant = (status) =>
    status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'danger' : 'warning';

  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-3">
      {/* ===== KOLOM KIRI ===== */}
      <div className="lg:col-span-1 space-y-4">

        {/* Info Pengguna */}
        <div className="surface-hero rounded-xl p-5">
          <div className="relative">
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 text-xl font-bold"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-base font-bold leading-tight" style={{ color: '#e6edf3' }}>
              {user.name}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(52,211,153,0.7)' }}>
              NPM: <span className="font-mono font-semibold" style={{ color: '#34d399' }}>{user.npm || '-'}</span>
            </p>
            <div className="mt-3 flex gap-2 flex-wrap">
              <span
                className="rounded-full border border-accent-500/20 bg-accent-500/10 px-2.5 py-1 text-xs font-semibold text-accent-400"
              >
                {user.kelas || '-'}
              </span>
              {todayBadgeVariant && (
                <Badge variant={todayBadgeVariant}>
                  {todayRecord.status === 'TERLAMBAT' ? 'Terlambat' : 'Hadir Hari Ini'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Kamera Selfie */}
        <Card>
          <CardHeader title="Verifikasi Wajah" />
          <div
            className="relative rounded-xl overflow-hidden aspect-video mb-4"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
          >
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
            <Button id="btn-capture" onClick={capture} disabled={captureLocked} variant="secondary" className="w-full" size="lg">
              <Camera size={17} />
              Ambil Foto
            </Button>
          ) : (
            <Button
              id="btn-retake"
              onClick={() => setImgSrc(null)}
              variant="ghost"
              className="w-full"
              size="lg"
            >
              <RotateCcw size={17} />
              Ulangi Foto
            </Button>
          )}
        </Card>

        {/* Aksi Absensi */}
        <Card>
          <CardHeader title="Aksi Absensi" />

          {message.text && (
            <div
              className="flex items-start gap-2 rounded-lg p-3 text-sm"
              style={{
                background: message.type === 'error'
                  ? 'rgba(239,68,68,0.1)'
                  : message.type === 'warning'
                  ? 'rgba(245,158,11,0.1)'
                  : 'rgba(16,185,129,0.1)',
                border: `1px solid ${
                  message.type === 'error'
                    ? 'rgba(239,68,68,0.2)'
                    : message.type === 'warning'
                    ? 'rgba(245,158,11,0.2)'
                    : 'rgba(16,185,129,0.2)'
                }`,
                color: message.type === 'error' ? '#f87171' : message.type === 'warning' ? '#fbbf24' : '#34d399',
              }}
            >
              {message.type === 'success'
                ? <CheckCircle size={15} className="mt-0.5 shrink-0" />
                : <AlertCircle size={15} className="mt-0.5 shrink-0" />
              }
              {message.text}
            </div>
          )}

          {loading ? (
            <Button disabled className="w-full py-6 text-base" size="lg">
              <Loader2 size={22} className="animate-spin" />
              Memproses...
            </Button>
          ) : todayRecord ? (
            <Button
              disabled
              variant="secondary"
              className="w-full py-6 text-base cursor-not-allowed"
              size="lg"
            >
              <CheckCircle2 size={22} />
              Sudah Absen Hari Ini
            </Button>
          ) : (
            <Button
              id="btn-absen-apel"
              onClick={handleAbsenApel}
              disabled={absenLocked}
              variant="primary"
              className="w-full py-6 text-base"
              size="lg"
              style={{ boxShadow: '0 0 32px rgba(16,185,129,0.25)' }}
            >
              <CalendarCheck size={22} />
              Absen Apel
            </Button>
          )}



          {location && (
            <div
              className="rounded-lg p-2.5"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
            >
              <p className="flex flex-wrap items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Crosshair size={11} />
                Akurasi GPS:{' '}
                <span
                  className="font-semibold"
                  style={{
                    color: location.accuracy > 100
                      ? '#f87171'
                      : location.accuracy > 50
                      ? '#fbbf24'
                      : '#34d399',
                  }}
                >
                  {location.accuracy ? `±${location.accuracy.toFixed(0)}m` : 'N/A'}
                </span>
                {location.accuracy > 100 && (
                  <span style={{ color: '#f87171' }} className="ml-1">(terlalu rendah)</span>
                )}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* ===== KOLOM KANAN ===== */}
      <div className="lg:col-span-2 space-y-4">

        {/* Peta Lokasi */}
        <Card>
          <CardHeader
            title="Lokasi Saat Ini"
            action={
              <Button id="btn-refresh-location" onClick={getLocation} variant="secondary" size="sm">
                <MapPin size={13} />
                Perbarui
              </Button>
            }
          />

          {locationError && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
            >
              {locationError}
            </div>
          )}

          <div
            className="relative z-0 h-72 overflow-hidden rounded-xl sm:h-80"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-base)' }}
          >
            {location ? (
              <MapContainer
                center={[location.lat, location.lng]}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[location.lat, location.lng]}>
                  <Popup>Lokasi Anda</Popup>
                </Marker>
                <Circle
                  center={officeCoord}
                  pathOptions={{
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 0.15,
                  }}
                  radius={settings.MAX_RADIUS}
                />
                <Marker position={officeCoord}>
                  <Popup>Lokasi Apel</Popup>
                </Marker>
              </MapContainer>
            ) : (
              <div
                className="flex flex-col items-center justify-center h-full gap-2"
                style={{ color: 'var(--text-muted)' }}
              >
                <MapPin size={30} strokeWidth={1.5} />
                <span className="text-sm">Memuat lokasi...</span>
              </div>
            )}
          </div>

          {/* Koordinat tiles */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {[
              { label: 'Latitude', value: location?.lat?.toFixed(6) || '-' },
              { label: 'Longitude', value: location?.lng?.toFixed(6) || '-' },
              { label: 'Akurasi', value: location?.accuracy ? `±${location.accuracy.toFixed(0)}m` : '-' },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg p-2.5 text-center"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
              >
                <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="text-xs font-mono font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Riwayat Absensi */}
        <Card>
          <CardHeader title="Riwayat Absensi" />
          <Table
            headers={[
              { label: 'Tanggal' },
              { label: 'Waktu Absen' },
              { label: 'Status' },
              { label: 'Foto' },
            ]}
          >
            {attendances.length === 0 ? (
              <EmptyRow colSpan={4} message="Belum ada riwayat absensi." />
            ) : (
              attendances.map((a) => (
                <tr key={a.id_absensi}>
                  <td className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {new Date(a.tanggal).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {a.jam_absen ? new Date(a.jam_absen).toLocaleTimeString('id-ID') : '-'}
                  </td>
                  <td>
                    <Badge variant={a.status === 'TERLAMBAT' ? 'warning' : 'success'}>
                      {a.status === 'TERLAMBAT' ? 'Terlambat' : 'Hadir'}
                    </Badge>
                  </td>
                  <td>
                    {a.foto_selfie ? (
                      <a href={a.foto_selfie} target="_blank" rel="noopener noreferrer">
                        <img
                          src={a.foto_selfie}
                          alt="Selfie"
                          className="w-10 h-10 rounded-xl object-cover cursor-pointer hover:scale-110 transition-transform"
                          style={{ border: '2px solid var(--border)' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        />
                      </a>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </Table>
        </Card>

        {/* Riwayat Izin */}
        <Card>
          <CardHeader
            title="Pengajuan Izin"
            action={
              <Button onClick={() => setShowIzinModal(true)} variant="primary" size="sm">
                <FileText size={13} />
                Ajukan Izin
              </Button>
            }
          />
          <Table
            headers={[
              { label: 'Tanggal' },
              { label: 'Jenis' },
              { label: 'Status', align: 'center' },
            ]}
          >
            {izins.length === 0 ? (
              <EmptyRow colSpan={3} message="Belum ada riwayat izin." />
            ) : (
              izins.map((i) => (
                <tr key={i.id}>
                  <td className="font-medium text-xs" style={{ color: 'var(--text-primary)' }}>
                    {new Date(i.tanggal_awal).toLocaleDateString('id-ID')} -{' '}
                    {new Date(i.tanggal_akhir).toLocaleDateString('id-ID')}
                  </td>
                  <td className="text-xs" style={{ color: 'var(--text-secondary)' }}>{i.jenis_izin}</td>
                  <td className="text-center">
                    <Badge variant={getBadgeVariant(i.status)}>{i.status}</Badge>
                  </td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      </div>

      {/* Modal Izin */}
      <Modal
        open={showIzinModal}
        onClose={() => {
          setShowIzinModal(false);
          setLampiranPreview(null);
          setFormIzin({
            tanggal_awal: '',
            tanggal_akhir: '',
            jenis_izin: 'Sakit',
            keterangan: '',
            lampiran_url: null,
          });
        }}
        title="Form Pengajuan Izin"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Mulai Tanggal"
              type="date"
              value={formIzin.tanggal_awal}
              onChange={(e) => setFormIzin({ ...formIzin, tanggal_awal: e.target.value })}
            />
            <Input
              label="Sampai Tanggal"
              type="date"
              value={formIzin.tanggal_akhir}
              onChange={(e) => setFormIzin({ ...formIzin, tanggal_akhir: e.target.value })}
            />
          </div>
          <Select
            label="Jenis Izin"
            value={formIzin.jenis_izin}
            onChange={(e) => setFormIzin({ ...formIzin, jenis_izin: e.target.value })}
          >
            <option value="Sakit">Sakit</option>
            <option value="Izin">Izin (Keperluan Lain)</option>
            <option value="Surat Tugas">Surat Tugas / Kegiatan Kampus</option>
          </Select>
          <div className="space-y-1.5">
            <label className="form-label">Keterangan / Alasan</label>
            <textarea
              rows="2"
              className="form-input"
              placeholder="Berikan keterangan jelas"
              value={formIzin.keterangan}
              onChange={(e) => setFormIzin({ ...formIzin, keterangan: e.target.value })}
            />
          </div>

          {/* Upload Bukti */}
          <div className="space-y-1.5">
            <label className="form-label">
              Bukti Pendukung
              <span className="ml-1 font-normal" style={{ color: 'var(--text-muted)' }}>
                (Surat sakit, surat tugas, dll.)
              </span>
            </label>
            <label
              htmlFor="upload-lampiran"
              className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all group"
              style={{
                borderColor: 'rgba(16,185,129,0.25)',
                background: 'rgba(16,185,129,0.04)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.04)'}
            >
              {lampiranPreview ? (
                <div className="relative w-full h-full flex items-center justify-center p-2">
                  <img
                    src={lampiranPreview}
                    alt="Preview lampiran"
                    className="max-h-24 max-w-full object-contain rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setLampiranPreview(null);
                      setFormIzin((p) => ({ ...p, lampiran_url: null }));
                    }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: '#ef4444', color: '#fff' }}
                  >
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center gap-1.5 transition-colors"
                  style={{ color: 'rgba(16,185,129,0.5)' }}
                >
                  <Upload size={26} strokeWidth={1.5} />
                  <span className="text-xs font-medium">Klik untuk upload foto / gambar</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>JPG, PNG, maks. 5MB</span>
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

          <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowIzinModal(false);
                setLampiranPreview(null);
                setFormIzin({
                  tanggal_awal: '',
                  tanggal_akhir: '',
                  jenis_izin: 'Sakit',
                  keterangan: '',
                  lampiran_url: null,
                });
              }}
            >
              Batal
            </Button>
            <Button variant="primary" className="flex-1" loading={izinLoading} onClick={submitIzin}>
              {izinLoading ? 'Mengirim...' : 'Ajukan Izin'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
