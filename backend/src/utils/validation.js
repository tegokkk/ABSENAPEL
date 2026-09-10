const sharp = require('sharp');

const MAX_SELFIE_BYTES = 3 * 1024 * 1024;
const MAX_SELFIE_PIXELS = 12_000_000;
const SELFIE_PREFIX = 'data:image/jpeg;base64,';
const DECIMAL_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

class ValidationError extends Error {}

// Accept JSON numbers or complete decimal strings, never coercible objects or numeric prefixes.
function parseFiniteDecimal(value, label) {
  if (typeof value !== 'number' && typeof value !== 'string') {
    throw new ValidationError(`${label} harus berupa angka yang valid.`);
  }
  if (typeof value === 'string' && !DECIMAL_PATTERN.test(value.trim())) {
    throw new ValidationError(`${label} harus berupa angka yang valid.`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new ValidationError(`${label} harus berupa angka finite.`);
  }
  return number;
}

function validateCoordinates(latitude, longitude) {
  const lat = parseFiniteDecimal(latitude, 'Latitude');
  const lon = parseFiniteDecimal(longitude, 'Longitude');
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new ValidationError('Latitude harus antara -90 dan 90, longitude antara -180 dan 180.');
  }
  return { latitude: lat, longitude: lon };
}

function validateLocation({ latitude, longitude, radius_meter }) {
  const coordinates = validateCoordinates(latitude, longitude);
  const radius = parseFiniteDecimal(radius_meter, 'Radius lokasi');
  if (radius <= 0) throw new ValidationError('Radius lokasi harus lebih besar dari nol.');
  return { ...coordinates, radius_meter: radius };
}

function validateLocationName(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('Nama lokasi wajib diisi dengan teks.');
  }
  return value.trim();
}

function validateGps({ latitude, longitude, accuracy, gps_timestamp }) {
  const coordinates = validateCoordinates(latitude, longitude);
  const acc = parseFiniteDecimal(accuracy, 'Akurasi GPS');
  if (acc < 0) throw new ValidationError('Akurasi GPS tidak boleh negatif.');
  if (acc > 100) {
    throw new ValidationError('Akurasi GPS terlalu rendah. Silakan aktifkan GPS akurasi tinggi.');
  }
  const timestamp = gps_timestamp == null ? null : parseFiniteDecimal(gps_timestamp, 'Timestamp GPS');
  if (timestamp !== null && timestamp < 0) {
    throw new ValidationError('Timestamp GPS tidak boleh negatif.');
  }
  return { ...coordinates, accuracy: acc, gps_timestamp: timestamp };
}

async function validateSelfie(value) {
  if (!value) throw new ValidationError('Foto selfie wajib disertakan.');
  if (typeof value !== 'string' || !value.startsWith(SELFIE_PREFIX)) {
    throw new ValidationError('Foto selfie harus berupa gambar JPEG dalam format data URL base64.');
  }

  const encoded = value.slice(SELFIE_PREFIX.length);
  // Check the encoded length before allocating a decoded buffer.
  if (encoded.length > 4 * Math.ceil(MAX_SELFIE_BYTES / 3)) {
    throw new ValidationError('Ukuran foto selfie maksimal 3 MiB.');
  }
  if (!encoded || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw new ValidationError('Data foto selfie tidak valid atau rusak.');
  }
  const buffer = Buffer.from(encoded, 'base64');
  if (buffer.length > MAX_SELFIE_BYTES) {
    throw new ValidationError('Ukuran foto selfie maksimal 3 MiB.');
  }
  if (buffer.toString('base64') !== encoded || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new ValidationError('Data foto selfie bukan gambar JPEG yang valid.');
  }

  try {
    // Decode all pixels; checking MIME, magic bytes, or metadata alone misses corrupt JPEGs.
    await sharp(buffer, { failOn: 'warning', limitInputPixels: MAX_SELFIE_PIXELS }).raw().toBuffer();
  } catch {
    throw new ValidationError('Foto selfie rusak atau melebihi batas 12 megapiksel. Ambil foto kembali.');
  }
  return value;
}

module.exports = {
  MAX_SELFIE_BYTES,
  MAX_SELFIE_PIXELS,
  ValidationError,
  parseFiniteDecimal,
  validateCoordinates,
  validateLocation,
  validateLocationName,
  validateGps,
  validateSelfie,
};
