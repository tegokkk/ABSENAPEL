const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authMiddleware, adminOnly } = require('../middlewares/auth');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "smartattendance_timdis_2024";

// =============================================
// AUTH
// =============================================

router.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username dan password wajib diisi" });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.trim() },
    });
    if (!user)
      return res.status(401).json({ error: "Username atau password salah" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(401).json({ error: "Username atau password salah" });

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        name: user.name,
        kelas: user.kelas,
        npm: user.npm,
      },
      SECRET_KEY,
      { expiresIn: "1d" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        kelas: user.kelas,
        npm: user.npm,
      },
    });
  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
