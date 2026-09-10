import { useEffect, useId, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { AlertCircle, Camera, Loader2, RotateCcw } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';
import Button from '../ui/Button';

const VIDEO_CONSTRAINTS = { facingMode: 'user' };

function cameraErrorMessage(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'Akses kamera ditolak. Izinkan kamera pada pengaturan situs di browser, lalu klik Coba Lagi.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'Kamera tidak ditemukan. Hubungkan atau aktifkan kamera perangkat, lalu klik Coba Lagi.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Kamera tidak dapat dibuka. Tutup aplikasi lain yang memakai kamera, lalu klik Coba Lagi.';
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'Kamera tidak mendukung pengaturan ini. Gunakan kamera lain atau browser terbaru, lalu klik Coba Lagi.';
    default:
      return !navigator.mediaDevices?.getUserMedia
        ? 'Kamera tidak tersedia di browser ini. Buka situs melalui HTTPS atau localhost dengan browser yang mendukung kamera.'
        : 'Kamera gagal disiapkan. Periksa izin dan perangkat kamera, lalu klik Coba Lagi.';
  }
}

function CameraCapture({ onCapture, onRetry }) {
  const webcamRef = useRef(null);
  const captureLockRef = useRef(false);
  const captureTimerRef = useRef(null);
  const [status, setStatus] = useState('preparing');
  const [error, setError] = useState('');
  const [captureLocked, setCaptureLocked] = useState(false);
  const statusId = useId();

  useEffect(() => () => clearTimeout(captureTimerRef.current), []);

  const markReady = (event) => {
    const video = event.currentTarget;
    // A granted stream can arrive before the video has a usable frame.
    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      setStatus('ready');
      setError('');
    }
  };

  const capture = () => {
    if (status !== 'ready' || captureLockRef.current) return;
    captureLockRef.current = true;
    setCaptureLocked(true);
    captureTimerRef.current = setTimeout(() => {
      captureLockRef.current = false;
      setCaptureLocked(false);
    }, 800);
    try {
      const image = webcamRef.current?.getScreenshot();
      if (!image) {
        setError('Foto belum berhasil diambil. Tunggu pratinjau kamera tampil, lalu klik Ambil Foto kembali.');
        return;
      }
      setError('');
      onCapture(image);
    } catch {
      setError('Foto gagal diambil. Klik Coba Lagi untuk menyiapkan ulang kamera.');
      setStatus('error');
    }
  };

  return (
    <>
      <div className="relative rounded-xl overflow-hidden aspect-video" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="w-full h-full object-cover"
          videoConstraints={VIDEO_CONSTRAINTS}
          onLoadedData={markReady}
          onCanPlay={markReady}
          onUserMediaError={(mediaError) => {
            setStatus('error');
            setError(cameraErrorMessage(mediaError));
          }}
          aria-label="Pratinjau kamera selfie"
        />
        {status !== 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-muted" style={{ background: 'var(--bg-base)' }}>
            {status === 'error' ? <AlertCircle size={26} /> : <Loader2 size={26} className="animate-spin" />}
            <span className="text-sm">{status === 'error' ? 'Kamera belum tersedia' : 'Menyiapkan kamera...'}</span>
          </div>
        )}
      </div>
      <p id={statusId} role={error ? 'alert' : 'status'} className={`text-xs leading-relaxed ${error ? 'text-danger-500' : 'text-muted'}`}>
        {error || (status === 'ready' ? 'Kamera siap. Pastikan wajah terlihat jelas sebelum mengambil foto.' : 'Izinkan akses kamera jika browser meminta izin.')}
      </p>
      {status === 'error' ? (
        <Button id="btn-retry-camera" onClick={onRetry} aria-describedby={statusId} variant="secondary" className="w-full" size="lg">
          <RotateCcw size={17} />
          Coba Lagi
        </Button>
      ) : (
        <Button id="btn-capture" onClick={capture} disabled={status !== 'ready' || captureLocked} aria-describedby={statusId} variant="secondary" className="w-full" size="lg">
          <Camera size={17} />
          Ambil Foto
        </Button>
      )}
    </>
  );
}

export default function SelfieCamera({ image, onCapture, onRetake }) {
  const [attempt, setAttempt] = useState(0);

  return (
    <Card>
      <CardHeader title="Foto Selfie" />
      {image ? (
        <>
          <div className="relative rounded-xl overflow-hidden aspect-video" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
            <img src={image} alt="Selfie yang akan dikirim untuk absensi" className="w-full h-full object-cover" />
          </div>
          <Button id="btn-retake" onClick={onRetake} variant="ghost" className="w-full" size="lg">
            <RotateCcw size={17} />
            Ulangi Foto
          </Button>
        </>
      ) : (
        <CameraCapture key={attempt} onCapture={onCapture} onRetry={() => setAttempt((value) => value + 1)} />
      )}
    </Card>
  );
}
