const config = require('../config/env');

/**
 * Menghitung jarak antara dua titik koordinat menggunakan rumus Haversine
 * @param {number} lat1 - Latitude titik 1
 * @param {number} lon1 - Longitude titik 1
 * @param {number} lat2 - Latitude titik 2
 * @param {number} lon2 - Longitude titik 2
 * @returns {number} Jarak dalam meter
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius bumi dalam meter
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Mengecek apakah koordinat berada dalam radius lokasi kampus
 * @param {number} lat - Latitude user
 * @param {number} lng - Longitude user
 * @returns {{ distance: number, isValid: boolean, message: string }}
 */
function isWithinRadius(lat, lng) {
  const distance = calculateDistance(lat, lng, config.office.lat, config.office.lng);
  const isValid = distance <= config.office.radius;

  return {
    distance: Math.round(distance),
    isValid,
    message: isValid
      ? `Lokasi valid. Anda berada ${Math.round(distance)}m dari ${config.office.name}.`
      : `Lokasi tidak valid. Anda berada ${Math.round(distance)}m dari ${config.office.name}. Maksimal radius: ${config.office.radius}m.`,
  };
}

module.exports = { calculateDistance, isWithinRadius };
