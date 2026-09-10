import { useCallback, useEffect, useRef, useState } from 'react';

function locationErrorMessage(error) {
  switch (error.code) {
    case 1:
      return 'Akses lokasi ditolak. Izinkan lokasi pada pengaturan situs di browser, lalu klik Perbarui.';
    case 2:
      return 'Lokasi perangkat belum tersedia. Aktifkan GPS dan coba dari area terbuka, lalu klik Perbarui.';
    case 3:
      return 'Pencarian lokasi terlalu lama. Pastikan GPS dan koneksi aktif, lalu klik Perbarui untuk mencoba lagi.';
    default:
      return 'Gagal mendapatkan lokasi. Periksa izin lokasi dan GPS perangkat, lalu klik Perbarui.';
  }
}

export function useCurrentLocation() {
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [locating, setLocating] = useState(false);
  const activeRequestRef = useRef(0);
  const pendingRef = useRef(false);

  const getLocation = useCallback(() => {
    if (pendingRef.current) return;
    if (!navigator.geolocation) {
      setLocationError('Lokasi tidak didukung browser ini. Gunakan browser dengan dukungan lokasi melalui HTTPS atau localhost.');
      return;
    }

    pendingRef.current = true;
    const request = ++activeRequestRef.current;
    setLocating(true);
    setLocationError('');
    // An old fix must not be submitted while a fresh lookup is pending or fails.
    setLocation(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (request !== activeRequestRef.current) return;
        pendingRef.current = false;
        setLocating(false);
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        if (request !== activeRequestRef.current) return;
        pendingRef.current = false;
        setLocating(false);
        setLocationError(locationErrorMessage(error));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  useEffect(() => {
    getLocation();
    return () => {
      // Geolocation has no cancellation API; ignore callbacks after cleanup.
      activeRequestRef.current += 1;
      pendingRef.current = false;
    };
  }, [getLocation]);

  return { location, locationError, locating, getLocation };
}
