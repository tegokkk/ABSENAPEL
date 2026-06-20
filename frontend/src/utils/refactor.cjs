const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../pages/AdminDashboard.jsx');
let adminCode = fs.readFileSync(adminPath, 'utf8');

// Replace imports
adminCode = adminCode.replace(
  "import axios from 'axios';",
  "import { attendanceApi } from '../services/attendanceApi';\nimport { usersApi } from '../services/usersApi';\nimport { lokasiApi } from '../services/lokasiApi';\nimport { settingsApi } from '../services/settingsApi';"
);
adminCode = adminCode.replace(
  "const API = `${import.meta.env.VITE_API_URL || ''}/api`;\nconst token = () => localStorage.getItem('token');\nconst headers = () => ({ Authorization: `Bearer ${token()}` });\n",
  ""
);

// TabAbsensi
adminCode = adminCode.replace(
  "const res = await axios.get(url, { headers: headers() });\n      setAttendances(res.data);",
  "const data = await attendanceApi.getAttendance({ kelas: kelas !== 'Semua Kelas' ? kelas : undefined });\n      setAttendances(data);"
);
adminCode = adminCode.replace(
  "await axios.delete(`${API}/attendance/${id}`, { headers: headers() });",
  "await attendanceApi.deleteAttendance(id);"
);

// TabUsers
adminCode = adminCode.replace(
  "const res = await axios.get(url, { headers: headers() });\n      setUsers(res.data);",
  "const data = await usersApi.getUsers({ kelas: kelas !== 'Semua Kelas' ? kelas : undefined });\n      setUsers(data);"
);
adminCode = adminCode.replace(
  "await axios.put(`${API}/users/${editUser.id}`, form, { headers: headers() });",
  "await usersApi.updateUser(editUser.id, form);"
);
adminCode = adminCode.replace(
  "await axios.post(`${API}/users`, form, { headers: headers() });",
  "await usersApi.createUser(form);"
);
adminCode = adminCode.replace(
  "await axios.delete(`${API}/users/${user.id}`, { headers: headers() });",
  "await usersApi.deleteUser(user.id);"
);
adminCode = adminCode.replace(
  "const res = await axios.put(`${API}/users/${user.id}/reset-password`, {}, { headers: headers() });\n      setActionMsg(res.data.message);",
  "const data = await usersApi.resetPassword(user.id);\n      setActionMsg(data.message);"
);

// TabSettings
adminCode = adminCode.replace(
  "axios.get(`${API}/settings`, { headers: headers() }),\n        axios.get(`${API}/lokasi`, { headers: headers() }),",
  "settingsApi.getSettings(),\n        lokasiApi.getLokasi(),"
);
adminCode = adminCode.replace(
  "const res = await axios.put(`${API}/settings`, { BATAS_TERLAMBAT: batasTerlambat }, { headers: headers() });\n      setMsg(res.data.message);",
  "const data = await settingsApi.updateSettings({ BATAS_TERLAMBAT: batasTerlambat });\n      setMsg(data.message);"
);
adminCode = adminCode.replace(
  "await axios.put(`${API}/lokasi/${id}/activate`, {}, { headers: headers() });",
  "await lokasiApi.activateLokasi(id);"
);
adminCode = adminCode.replace(
  "await axios.put(`${API}/lokasi/${editId}`, form, { headers: headers() });",
  "await lokasiApi.updateLokasi(editId, form);"
);
adminCode = adminCode.replace(
  "await axios.post(`${API}/lokasi`, form, { headers: headers() });",
  "await lokasiApi.createLokasi(form);"
);
adminCode = adminCode.replace(
  "await axios.delete(`${API}/lokasi/${loc.id}`, { headers: headers() });",
  "await lokasiApi.deleteLokasi(loc.id);"
);

fs.writeFileSync(adminPath, adminCode);

const userPath = path.join(__dirname, '../pages/UserDashboard.jsx');
let userCode = fs.readFileSync(userPath, 'utf8');

userCode = userCode.replace(
  "import axios from 'axios';",
  "import { attendanceApi } from '../services/attendanceApi';\nimport { izinApi } from '../services/izinApi';\nimport { settingsApi } from '../services/settingsApi';"
);
userCode = userCode.replace(
  "const API = `${import.meta.env.VITE_API_URL || ''}/api`;\nconst token = () => localStorage.getItem('token');\nconst headers = () => ({ Authorization: `Bearer ${token()}` });\n",
  ""
);

// We replace these safely using regex because we don't know the exact spacing
userCode = userCode.replace(/axios\.get\(`\$\{API\}\/settings`, \{ headers: headers\(\) \}\)/g, "settingsApi.getSettings()");
userCode = userCode.replace(/axios\.get\(`\$\{API\}\/attendance\?userId=\$\{user\.id\}`, \{ headers: headers\(\) \}\)/g, "attendanceApi.getAttendance({ userId: user.id })");
userCode = userCode.replace(/const res = await axios\.get\(`\$\{API\}\/izin`, \{ headers: headers\(\) \}\);\n      setHistoryIzin\(res\.data\);/g, "const data = await izinApi.getIzins();\n      setHistoryIzin(data);");
userCode = userCode.replace(/await axios\.post\(\n\s*`\$\{API\}\/izin`,\n\s*payload,\n\s*\{\s*headers: \{\s*\.\.\.headers\(\),\s*'Content-Type': 'application\/json'\s*\}\s*\}\n\s*\);/g, "await izinApi.createIzin(payload);");
userCode = userCode.replace(/const res = await axios\.post\(\n\s*`\$\{API\}\/attendance\/apel`,\n\s*payload,\n\s*\{\s*headers: \{\s*\.\.\.headers\(\),\s*'Content-Type': 'application\/json'\s*\}\s*\}\n\s*\);/g, "const res = await attendanceApi.submitApel(payload);");


fs.writeFileSync(userPath, userCode);
console.log("Refactoring complete");
