const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authMiddleware, adminOnly } = require('../middlewares/auth');
const { getSettings, getDistance, getClientIP } = require('../utils/helpers');

// =============================================
// SETTINGS (Admin Only untuk PUT)
// =============================================

router.get("/api/settings", authMiddleware, async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/api/settings", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { BATAS_TERLAMBAT } = req.body;

    if (BATAS_TERLAMBAT !== undefined && BATAS_TERLAMBAT !== null && BATAS_TERLAMBAT !== "") {
      await prisma.settings.upsert({
        where: { key: "BATAS_TERLAMBAT" },
        update: { value: String(BATAS_TERLAMBAT) },
        create: { key: "BATAS_TERLAMBAT", value: String(BATAS_TERLAMBAT) },
      });
    }

    const newSettings = await getSettings();
    res.json({
      message: "Pengaturan berhasil disimpan",
      settings: newSettings,
    });
  } catch (error) {
    console.error("[SETTINGS ERROR]", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
