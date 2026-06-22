const prisma = require('./prisma');

// =============================================
// HELPER FUNCTIONS
// =============================================

// Rumus Haversine — menghitung jarak dua titik koordinat (meter)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getSettings() {
  const rows = await prisma.settings.findMany();
  const map = {};
  rows.forEach((r) => (map[r.key] = r.value));

  // Ambil lokasi aktif
  const activeLocation = await prisma.lokasiAbsen.findFirst({
    where: { is_active: true },
  });

  return {
    OFFICE_LAT: activeLocation ? activeLocation.latitude : -5.3569503,
    OFFICE_LON: activeLocation ? activeLocation.longitude : 105.2317229,
    MAX_RADIUS: activeLocation ? activeLocation.radius_meter : 100,
    BATAS_TERLAMBAT: map.BATAS_TERLAMBAT ?? "08:00",
    active_location: activeLocation
      ? {
          id: activeLocation.id,
          nama_lokasi: activeLocation.nama_lokasi,
          latitude: activeLocation.latitude,
          longitude: activeLocation.longitude,
          radius_meter: activeLocation.radius_meter,
        }
      : null,
  };
}

function checkIsLate(batasTerlambat) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    hour12: false,
    hour: 'numeric',
    minute: 'numeric'
  });
  
  const parts = formatter.formatToParts(now);
  let currentHour, currentMinute;
  for (const part of parts) {
    if (part.type === 'hour') currentHour = parseInt(part.value, 10);
    if (part.type === 'minute') currentMinute = parseInt(part.value, 10);
  }
  if (currentHour === 24) currentHour = 0;
  
  const [batasHour, batasMenit] = batasTerlambat.split(":").map(Number);
  if (currentHour > batasHour) return true;
  if (currentHour === batasHour && currentMinute >= batasMenit)
    return true;
  return false;
}

// =============================================
// HELPER: Ambil IP address dari request
// =============================================

// Ambil IP address dari request
function getClientIP(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    null
  );
}

module.exports = { getDistance, getSettings, checkIsLate, getClientIP };