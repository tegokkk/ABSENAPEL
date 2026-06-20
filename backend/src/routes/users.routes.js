const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authMiddleware, adminOnly } = require('../middlewares/auth');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "smartattendance_timdis_2024";

// =============================================
// USERS — CRUD (Admin Only)
// =============================================

router.get("/api/users", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { kelas } = req.query;
    const where = { role: "MAHASISWA" };
    if (kelas && kelas !== "Semua Kelas") where.kelas = kelas;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        npm: true,
        kelas: true,
        role: true,
      },
      orderBy: [{ kelas: "asc" }, { name: "asc" }],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/api/users", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, npm, kelas } = req.body;
    if (!name || !npm || !kelas) {
      return res
        .status(400)
        .json({ error: "Nama, NPM, dan kelas wajib diisi" });
    }

    const hashedPassword = await bcrypt.hash(npm.trim(), 10);
    const user = await prisma.user.create({
      data: {
        username: name.trim(),
        password: hashedPassword,
        name: name.trim(),
        npm: npm.trim(),
        kelas,
        role: "MAHASISWA",
      },
    });
    res.status(201).json({
      message: "Mahasiswa berhasil ditambahkan",
      user: { id: user.id, name: user.name, npm: user.npm, kelas: user.kelas },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Nama atau NPM sudah terdaftar" });
    }
    console.error("[ADD USER ERROR]", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/api/users/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, npm, kelas } = req.body;

    const updateData = {};
    if (name) {
      updateData.name = name.trim();
      updateData.username = name.trim();
    }
    if (npm) updateData.npm = npm.trim();
    if (kelas) updateData.kelas = kelas;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: { id: true, name: true, npm: true, kelas: true, username: true },
    });
    res.json({ message: "Data mahasiswa berhasil diperbarui", user });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Nama atau NPM sudah digunakan" });
    }
    console.error("[EDIT USER ERROR]", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/api/users/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.attendance.deleteMany({ where: { userId: parseInt(id) } });
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({
      message: "Mahasiswa berhasil dihapus beserta seluruh data absensinya",
    });
  } catch (error) {
    console.error("[DELETE USER ERROR]", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.put(
  "/api/users/:id/reset-password",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
      });
      if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

      const newPassword = await bcrypt.hash(user.npm || "123456", 10);
      await prisma.user.update({
        where: { id: parseInt(id) },
        data: { password: newPassword },
      });
      res.json({ message: `Password berhasil direset ke NPM: ${user.npm}` });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  },
);

module.exports = router;
