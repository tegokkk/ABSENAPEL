const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const sharp = require('sharp');
const {
  ValidationError, parseFiniteDecimal, validateCoordinates, validateGps,
  validateLocation, validateLocationName, validateSelfie, MAX_SELFIE_BYTES,
} = require('../src/utils/validation');
const { getDistance } = require('../src/utils/distance');
const { getWibDayBounds } = require('../src/utils/dateTime');

test('numeric input accepts complete decimals and rejects coercion, prefixes, and nonfinite values', () => {
  for (const value of [0, -5.35, '105.23', ' 1e2 ', '.5']) {
    assert.equal(parseFiniteDecimal(value, 'Nilai'), Number(value));
  }
  for (const value of ['', ' ', null, undefined, true, [], {}, '12abc', '0x10', 'NaN', Infinity, NaN]) {
    assert.throws(() => parseFiniteDecimal(value, 'Nilai'), ValidationError);
  }
});

test('coordinate bounds, GPS accuracy, and positive location radius are enforced', () => {
  assert.deepEqual(validateCoordinates('-90', '180'), { latitude: -90, longitude: 180 });
  for (const [latitude, longitude] of [[90.001, 0], [-90.001, 0], [0, 180.001], [0, -180.001]]) {
    assert.throws(() => validateCoordinates(latitude, longitude), ValidationError);
  }
  for (const accuracy of [-1, 100.01, null, '1wrong']) {
    assert.throws(() => validateGps({ latitude: 0, longitude: 0, accuracy }), ValidationError);
  }
  for (const accuracy of [0, 100]) {
    assert.equal(validateGps({ latitude: 0, longitude: 0, accuracy }).accuracy, accuracy);
  }
  for (const radius_meter of [0, -1, null, '100m', Infinity]) {
    assert.throws(() => validateLocation({ latitude: 0, longitude: 0, radius_meter }), ValidationError);
  }
  assert.equal(validateLocationName('  Lapangan  '), 'Lapangan');
  for (const value of ['', ' ', null, {}]) assert.throws(() => validateLocationName(value), ValidationError);
});

test('a real JPEG selfie is accepted while fake, truncated, mismatched, and oversized input is rejected', async () => {
  const jpeg = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#22aa66' } }).jpeg().toBuffer();
  const selfie = 'data:image/jpeg;base64,' + jpeg.toString('base64');
  assert.equal(await validateSelfie(selfie), selfie);
  const png = await sharp(jpeg).png().toBuffer();
  for (const value of [
    '', 'bukan-gambar', {}, 'data:image/png;base64,' + png.toString('base64'),
    'data:image/jpeg;base64,' + png.toString('base64'),
    'data:image/jpeg;base64,/9g=',
    'data:image/jpeg;base64,' + jpeg.subarray(0, Math.floor(jpeg.length / 2)).toString('base64'),
    'data:image/jpeg;base64,%%%%',
    'data:image/jpeg;base64,' + 'A'.repeat(4 * Math.ceil(MAX_SELFIE_BYTES / 3) + 4),
  ]) await assert.rejects(() => validateSelfie(value), ValidationError);
});

test('JPEG input exceeding the pixel limit is rejected even when its encoded size is small', async () => {
  const jpeg = await sharp({ create: { width: 3500, height: 3500, channels: 3, background: '#ffffff' } }).jpeg().toBuffer();
  await assert.rejects(() => validateSelfie('data:image/jpeg;base64,' + jpeg.toString('base64')), /12 megapiksel/);
});

test('Haversine returns metres, zero for the same point, symmetric and finite antipodal distance', () => {
  assert.equal(getDistance(-5.35, 105.23, -5.35, 105.23), 0);
  assert.ok(Math.abs(getDistance(0, 0, 0, 1) - 111194.9266) < 0.01);
  assert.equal(getDistance(1, 2, 3, 4), getDistance(3, 4, 1, 2));
  assert.ok(Math.abs(getDistance(0, 0, 0, 180) - Math.PI * 6371000) < 0.01);
});

test('WIB day bounds include midnight and exclude the next midnight across month/year boundaries', () => {
  const cases = [
    ['2026-09-09T16:59:59.999Z', '2026-09-08T17:00:00.000Z', '2026-09-09T17:00:00.000Z'],
    ['2026-09-09T17:00:00.000Z', '2026-09-09T17:00:00.000Z', '2026-09-10T17:00:00.000Z'],
    ['2026-09-09T23:59:59.999Z', '2026-09-09T17:00:00.000Z', '2026-09-10T17:00:00.000Z'],
    ['2026-12-31T20:00:00.000Z', '2026-12-31T17:00:00.000Z', '2027-01-01T17:00:00.000Z'],
  ];
  for (const [instant, start, end] of cases) {
    const bounds = getWibDayBounds(new Date(instant));
    assert.equal(bounds.start.toISOString(), start);
    assert.equal(bounds.end.toISOString(), end);
  }
});

test('WIB bounds are identical for UTC and Asia/Jakarta server timezones at 01:00 WIB', () => {
  const modulePath = require.resolve('../src/utils/dateTime');
  const script = `const { getWibDayBounds } = require(${JSON.stringify(modulePath)}); console.log(JSON.stringify(getWibDayBounds(new Date('2026-09-09T18:00:00Z'))));`;
  const results = ['UTC', 'Asia/Jakarta'].map(TZ => JSON.parse(execFileSync(process.execPath, ['-e', script], {
    env: { ...process.env, TZ }, encoding: 'utf8',
  })));
  assert.deepEqual(results[0], results[1]);
  assert.equal(results[0].start, '2026-09-09T17:00:00.000Z');
  assert.equal(results[0].end, '2026-09-10T17:00:00.000Z');
});
