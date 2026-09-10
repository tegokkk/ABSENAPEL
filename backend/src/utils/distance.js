// Haversine distance in metres. Callers validate coordinate ranges first.
function getDistance(lat1, lon1, lat2, lon2) {
  const radians = value => value * Math.PI / 180;
  const a = Math.sin(radians(lat2 - lat1) / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(radians(lon2 - lon1) / 2) ** 2;
  // Floating-point rounding at antipodal points can otherwise make sqrt(1 - a) NaN.
  const bounded = Math.max(0, Math.min(1, a));
  return 6371000 * 2 * Math.atan2(Math.sqrt(bounded), Math.sqrt(1 - bounded));
}

module.exports = { getDistance };
