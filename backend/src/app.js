const express = require("express");
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

const { errorHandler } = require('./middlewares/error');

app.get("/", (req, res) => {
  res.send("Smart Attendance API Running");
});

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected", env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
    }});
  } catch (error) {
    res.status(500).json({ status: "error", database: "disconnected", message: error.message });
  }
});

// 404 Route Not Found handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan" });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
