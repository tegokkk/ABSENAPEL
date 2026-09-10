const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Asia/Jakarta uses UTC+07:00. UTC getters avoid depending on the server's timezone.
function getWibDayBounds(now = new Date()) {
  const wib = new Date(now.getTime() + WIB_OFFSET_MS);
  const start = new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()) - WIB_OFFSET_MS);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

module.exports = { getWibDayBounds };
