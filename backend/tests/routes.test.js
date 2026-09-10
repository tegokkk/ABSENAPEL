const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sharp = require('sharp');
const { getWibDayBounds } = require('../src/utils/dateTime');

// Replace Prisma before importing any application route: these tests never connect to a database.
process.env.JWT_SECRET = 'attendance-regression-test-secret-only';
let state;
const prisma = {
  user: { findUnique: async ({ where }) => where.username === 'DEMO' ? state.user : null },
  jadwalApel: { findMany: async () => state.schedules },
  attendance: {
    findFirst: async () => state.existingAttendance,
    create: async ({ data }) => {
      state.writes.push({ entity: 'attendance', data });
      if (state.duplicateError) throw Object.assign(new Error('duplicate'), { code: 'P2002' });
      return { id_absensi: 1, ...data };
    },
    findMany: async ({ where }) => {
      state.attendanceWhere = where;
      return state.records.filter(row => !where.tanggal || (
        row.tanggal >= where.tanggal.gte && row.tanggal < where.tanggal.lt
      ));
    },
    delete: async () => { state.writes.push({ entity: 'deleteAttendance' }); return {}; },
  },
  lokasiAbsen: {
    findFirst: async () => state.location,
    findUnique: async () => state.location,
    count: async () => 2,
    create: async ({ data }) => { state.writes.push({ entity: 'location', data }); return { id: 2, ...data }; },
    update: async ({ data }) => { state.writes.push({ entity: 'location', data }); return { ...state.location, ...data }; },
    updateMany: async () => { state.writes.push({ entity: 'locationsDeactivate' }); return { count: 1 }; },
  },
  pengajuanIzin: {
    create: async ({ data }) => { state.writes.push({ entity: 'izin', data }); return { id: 1, ...data }; },
    update: async ({ data }) => { state.writes.push({ entity: 'izinStatus', data }); return { id: 1, ...data }; },
    findMany: async () => [],
  },
  $transaction: async callback => callback(prisma),
};
const prismaPath = require.resolve('../src/utils/prisma');
require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: prisma };

const app = express();
app.use(express.json({ limit: '10mb' }));
for (const route of ['auth', 'attendance', 'lokasi', 'izin']) app.use(require(`../src/routes/${route}.routes`));
let server;
let baseURL;
let selfie;
let passwordHash;
const studentToken = jwt.sign({ id: 7, role: 'MAHASISWA' }, process.env.JWT_SECRET);
const adminToken = jwt.sign({ id: 1, role: 'ADMIN' }, process.env.JWT_SECRET);

before(async () => {
  passwordHash = await bcrypt.hash('demo-pass', 4);
  const jpeg = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#008855' } }).jpeg().toBuffer();
  selfie = 'data:image/jpeg;base64,' + jpeg.toString('base64');
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  baseURL = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(() => {
  state = {
    user: { id: 7, username: 'DEMO', name: 'Mahasiswa Uji', password: passwordHash, role: 'MAHASISWA' },
    schedules: [{ id: 4, waktu_mulai: new Date(Date.now() - 60000), batas_terlambat: new Date(Date.now() + 60000) }],
    location: { id: 1, nama_lokasi: 'Lapangan Uji', latitude: -5.35, longitude: 105.23, radius_meter: 100 },
    writes: [], records: [], existingAttendance: null,
  };
});

after(async () => {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
});

async function request(path, { method = 'GET', body, token = studentToken } = {}) {
  const response = await fetch(baseURL + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}
const validAttendance = overrides => ({ latitude: -5.35, longitude: 105.23, accuracy: 10, foto_selfie: selfie, ...overrides });
const submit = overrides => request('/api/attendance/apel', { method: 'POST', body: validAttendance(overrides) });

test('login accepts correct credentials and rejects incorrect credentials without issuing a token', async () => {
  const good = await request('/api/login', { method: 'POST', body: { username: 'DEMO', password: 'demo-pass' }, token: null });
  assert.equal(good.status, 200);
  assert.equal(jwt.verify(good.body.token, process.env.JWT_SECRET).id, 7);
  assert.equal(good.body.user.password, undefined);
  const bad = await request('/api/login', { method: 'POST', body: { username: 'DEMO', password: 'wrong' }, token: null });
  assert.equal(bad.status, 401);
  assert.equal(bad.body.token, undefined);
});

test('API authentication and admin authorization are enforced before writes', async () => {
  assert.equal((await request('/api/attendance', { token: null })).status, 401);
  assert.equal((await request('/api/attendance', { token: 'bad-token' })).status, 401);
  assert.equal((await request('/api/attendance/1', { method: 'DELETE' })).status, 403);
  assert.equal((await request('/api/lokasi', { method: 'POST', body: {} })).status, 403);
  assert.equal((await request('/api/izin/1/status', { method: 'PUT', body: { status: 'APPROVED' } })).status, 403);
  assert.equal(state.writes.length, 0);
});

test('valid attendance saves exactly once with server-controlled status and distance', async () => {
  const result = await submit({ status: 'REJECTED' });
  assert.equal(result.status, 200);
  assert.equal(result.body.status, 'HADIR');
  assert.equal(result.body.distance, 0);
  assert.equal(state.writes.length, 1);
  assert.equal(state.writes[0].data.userId, 7);
  assert.equal(state.writes[0].data.foto_selfie, selfie);
  assert.ok(state.writes[0].data.jam_absen instanceof Date);
});

test('invalid GPS and malformed selfies return 400 without writes; a later valid request still works', async () => {
  for (const invalid of [
    { accuracy: -1 }, { accuracy: 101 }, { latitude: 91 }, { longitude: -181 },
    { latitude: '12abc' }, { longitude: {} }, { accuracy: null },
    { foto_selfie: 'bukan-gambar' }, { foto_selfie: '' }, { foto_selfie: 'data:image/jpeg;base64,/9g=' },
  ]) assert.equal((await submit(invalid)).status, 400, JSON.stringify(invalid));
  assert.equal(state.writes.length, 0);
  assert.equal((await submit()).status, 200);
});

test('outside-radius attendance is rejected without writes', async () => {
  const result = await submit({ latitude: -5.4 });
  assert.equal(result.status, 400);
  assert.ok(result.body.distance > result.body.allowedRadius);
  assert.equal(state.writes.length, 0);
});

test('missing and overlapping schedules reject attendance without writes', async () => {
  state.schedules = [];
  assert.equal((await submit()).status, 400);
  state.schedules = [{ id: 1 }, { id: 2 }];
  assert.equal((await submit()).status, 409);
  assert.equal(state.writes.length, 0);
});

test('duplicate attendance is rejected both before insert and on database unique-conflict', async () => {
  state.existingAttendance = { id_absensi: 1 };
  assert.equal((await submit()).status, 400);
  assert.equal(state.writes.length, 0);
  state.existingAttendance = null;
  state.duplicateError = true;
  assert.equal((await submit()).status, 400);
});

test('invalid active admin location cannot be used for attendance or activated', async () => {
  state.location.radius_meter = -100;
  assert.equal((await submit()).status, 400);
  assert.equal((await request('/api/lokasi/1/activate', { method: 'PUT', token: adminToken })).status, 400);
  assert.equal(state.writes.length, 0);
});

test('location create and update share strict validation, preserving valid zero coordinates and omitted fields', async () => {
  for (const invalid of [
    { latitude: 91 }, { longitude: '105.23abc' }, { radius_meter: 0 }, { radius_meter: null }, { nama_lokasi: ' ' },
  ]) {
    const payload = { nama_lokasi: 'Uji', latitude: 0, longitude: 0, radius_meter: 100, ...invalid };
    assert.equal((await request('/api/lokasi', { method: 'POST', token: adminToken, body: payload })).status, 400);
    assert.equal((await request('/api/lokasi/1', { method: 'PUT', token: adminToken, body: invalid })).status, 400);
  }
  assert.equal(state.writes.length, 0);
  const create = await request('/api/lokasi', { method: 'POST', token: adminToken, body: { nama_lokasi: ' Uji ', latitude: '0', longitude: '0' } });
  assert.equal(create.status, 201);
  assert.equal(create.body.location.radius_meter, 100);
  assert.equal(create.body.location.latitude, 0);
  const update = await request('/api/lokasi/1', { method: 'PUT', token: adminToken, body: { radius_meter: '250' } });
  assert.equal(update.status, 200);
  assert.equal(update.body.location.latitude, -5.35);
  assert.equal(update.body.location.radius_meter, 250);
});

test('student attendance reads are scoped to the authenticated user', async () => {
  assert.equal((await request('/api/attendance')).status, 200);
  assert.equal(state.attendanceWhere.userId, 7);
});

test('statistics query includes the start of WIB day and excludes the next day', async () => {
  const { start, end } = getWibDayBounds();
  state.records = [
    { tanggal: new Date(start.getTime() - 1), status: 'HADIR', user: { kelas: 'MI 4A' } },
    { tanggal: start, status: 'HADIR', user: { kelas: 'MI 4A' } },
    { tanggal: new Date(end.getTime() - 1), status: 'TERLAMBAT', user: { kelas: 'MI 4A' } },
    { tanggal: end, status: 'HADIR', user: { kelas: 'MI 4A' } },
  ];
  const result = await request('/api/attendance/stats', { token: adminToken });
  assert.equal(result.status, 200);
  assert.equal(result.body.totalToday, 2);
  assert.equal(result.body.hadir, 1);
  assert.equal(result.body.terlambat, 1);
  assert.deepEqual(state.attendanceWhere.tanggal, { gte: start, lt: end });
});

test('permission dates reject reversed ranges, and admin status changes are persisted', async () => {
  const invalid = await request('/api/izin', { method: 'POST', body: { tanggal_awal: '2026-09-10', tanggal_akhir: '2026-09-09', jenis_izin: 'SAKIT', keterangan: 'Sakit' } });
  assert.equal(invalid.status, 400);
  assert.equal(state.writes.length, 0);
  const approved = await request('/api/izin/1/status', { method: 'PUT', token: adminToken, body: { status: 'APPROVED' } });
  assert.equal(approved.status, 200);
  assert.equal(state.writes[0].data.status, 'APPROVED');
  assert.equal(state.writes[0].data.approved_by, 1);
});
