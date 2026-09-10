const TIME_ZONE = 'Asia/Jakarta';

export function getWibDateKey(value = new Date()) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

export function isSameWibDay(value, target = new Date()) {
  const key = getWibDateKey(value);
  return key !== '' && key === getWibDateKey(target);
}

export function formatWibDate(value, options = {}) {
  return new Date(value).toLocaleDateString('id-ID', { ...options, timeZone: TIME_ZONE });
}

export function formatWibTime(value, options = {}) {
  return value ? new Date(value).toLocaleTimeString('id-ID', { ...options, timeZone: TIME_ZONE }) : '-';
}
