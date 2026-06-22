const fs = require('fs');
const path = require('path');

const indexJsPath = path.join(__dirname, '../index.js');
const srcDir = path.join(__dirname, '../src');

const content = fs.readFileSync(indexJsPath, 'utf-8');

function extractSection(header, nextHeader) {
    const startIdx = content.indexOf(`// ${header}`);
    if (startIdx === -1) return '';
    let endIdx = content.length;
    if (nextHeader) {
        const nextStart = content.indexOf(`// ${nextHeader}`);
        if (nextStart !== -1) {
            endIdx = content.lastIndexOf('// =============================================', nextStart);
        }
    }
    
    // go up to the preceding // ===
    const actualStart = content.lastIndexOf('// =============================================', startIdx);
    return content.substring(actualStart, endIdx).trim();
}

// Prisma util
const prismaContent = `const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

module.exports = prisma;
`;
fs.writeFileSync(path.join(srcDir, 'utils/prisma.js'), prismaContent);

// Helpers
let helpersRaw = extractSection('HELPER FUNCTIONS', 'MIDDLEWARE');
// We need to inject prisma import for helpers
let helpersContent = `const prisma = require('./prisma');\n\n` + helpersRaw;
// Add exports
helpersContent += `\n\nmodule.exports = { getDistance, getSettings, checkIsLate, getClientIP };`;
fs.writeFileSync(path.join(srcDir, 'utils/helpers.js'), helpersContent);

// Middlewares
let middlewaresRaw = extractSection('MIDDLEWARE', 'AUTH');
// Add imports
let middlewaresContent = `const jwt = require("jsonwebtoken");\nconst { getJwtSecret } = require("../utils/config");\n\n` + middlewaresRaw.replace(/SECRET_KEY/g, 'getJwtSecret()');
middlewaresContent += `\n\nmodule.exports = { authMiddleware, adminOnly };`;
fs.writeFileSync(path.join(srcDir, 'middlewares/auth.js'), middlewaresContent);

// Routes generator
function createRouteFile(filename, sectionHeader, nextSectionHeader) {
    let sectionRaw = extractSection(sectionHeader, nextSectionHeader);
    
    // Replace app.get, app.post, etc with router.get, router.post
    sectionRaw = sectionRaw.replace(/app\.get\(/g, 'router.get(');
    sectionRaw = sectionRaw.replace(/app\.post\(/g, 'router.post(');
    sectionRaw = sectionRaw.replace(/app\.put\(/g, 'router.put(');
    sectionRaw = sectionRaw.replace(/app\.delete\(/g, 'router.delete(');

    const imports = [
        `const express = require('express');`,
        `const router = express.Router();`,
        `const prisma = require('../utils/prisma');`,
        `const { authMiddleware, adminOnly } = require('../middlewares/auth');`
    ];

    // special imports
    if (filename === 'auth.routes.js' || filename === 'users.routes.js' || filename === 'seed.routes.js') {
        imports.push(`const bcrypt = require("bcryptjs");`);
    }
    if (filename === 'auth.routes.js') {
        imports.push(`const jwt = require("jsonwebtoken");`);
        imports.push(`const { getJwtSecret } = require("../utils/config");`);
        sectionRaw = sectionRaw.replace(/SECRET_KEY/g, 'getJwtSecret()');
    }
    if (filename === 'settings.routes.js' || filename === 'attendance.routes.js') {
        imports.push(`const { getSettings, getDistance, getClientIP } = require('../utils/helpers');`);
    }

    const finalContent = imports.join('\n') + '\n\n' + sectionRaw + '\n\nmodule.exports = router;\n';
    fs.writeFileSync(path.join(srcDir, `routes/${filename}`), finalContent);
}

createRouteFile('auth.routes.js', 'AUTH', 'SETTINGS');
createRouteFile('settings.routes.js', 'SETTINGS (Admin Only untuk PUT)', 'LOKASI ABSEN');
createRouteFile('lokasi.routes.js', 'LOKASI ABSEN — CRUD (Admin Only)', 'MASTER DATA AKADEMIK');
createRouteFile('master.routes.js', 'MASTER DATA AKADEMIK — CRUD (Admin Only)', 'USERS');
createRouteFile('users.routes.js', 'USERS — CRUD (Admin Only)', 'JADWAL APEL');
createRouteFile('jadwal.routes.js', 'JADWAL APEL — CRUD (Admin Only)', 'PENGAJUAN IZIN');
createRouteFile('izin.routes.js', 'PENGAJUAN IZIN — CRUD', 'ATTENDANCE');
// We have two attendance sections, let's just get from ATTENDANCE until SEED
createRouteFile('attendance.routes.js', 'ATTENDANCE — ABSEN APEL (dengan Anti-Fake GPS)', 'SEED');
createRouteFile('seed.routes.js', 'SEED — Reset dan isi ulang database', null); // goes to end mostly


// Create app.js
const appContent = `const express = require("express");
const cors = require("cors");
const prisma = require("./utils/prisma");

const app = express();

// CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      origin.includes("netlify.app") ||
      origin.includes("vercel.app") ||
      origin.includes("localhost") ||
      origin === process.env.FRONTEND_URL
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Routes
app.use(require('./routes/auth.routes'));
app.use(require('./routes/settings.routes'));
app.use(require('./routes/lokasi.routes'));
app.use(require('./routes/master.routes'));
app.use(require('./routes/users.routes'));
app.use(require('./routes/jadwal.routes'));
app.use(require('./routes/izin.routes'));
app.use(require('./routes/attendance.routes'));
app.use(require('./routes/seed.routes'));

app.get("/", (req, res) => {
  res.send("Smart Attendance API Running");
});

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw\`SELECT 1\`;
    res.json({ status: "ok", database: "connected", env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
    }});
  } catch (error) {
    res.status(500).json({ status: "error", database: "disconnected", message: error.message });
  }
});

module.exports = app;
`;
fs.writeFileSync(path.join(srcDir, 'app.js'), appContent);

// Create server.js
const serverContent = `require('dotenv').config();
const app = require('./src/app');
const PORT = process.env.PORT || 5000;

// Jalankan server HANYA di lokal (bukan di environment serverless)
const isServerless = process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
if (!isServerless && process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(\`Server Smart Attendance berjalan di port \${PORT}\`);
  });
}

module.exports = app; // For serverless
`;
fs.writeFileSync(path.join(__dirname, '../server.js'), serverContent);

console.log("Splitting complete!");
