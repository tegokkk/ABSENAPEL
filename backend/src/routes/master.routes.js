const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authMiddleware, adminOnly } = require('../middlewares/auth');

// =============================================
// MASTER DATA AKADEMIK — CRUD (Admin Only)
// =============================================

// --- JURUSAN ---
router.get("/api/jurusan", authMiddleware, async (req, res) => {
  try {
    const data = await prisma.jurusan.findMany({ include: { programStudi: true } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/api/jurusan", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nama, singkatan } = req.body;
    const data = await prisma.jurusan.create({ data: { nama, singkatan } });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/api/jurusan/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, singkatan } = req.body;
    const data = await prisma.jurusan.update({
      where: { id: parseInt(id) },
      data: { nama, singkatan }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/api/jurusan/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.jurusan.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Jurusan dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- PROGRAM STUDI ---
router.get("/api/program-studi", authMiddleware, async (req, res) => {
  try {
    const data = await prisma.programStudi.findMany({ include: { jurusan: true, kelas: true } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/api/program-studi", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nama, jurusanId } = req.body;
    const data = await prisma.programStudi.create({ data: { nama, jurusanId: parseInt(jurusanId) } });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/api/program-studi/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, jurusanId } = req.body;
    const updateData = {};
    if (nama) updateData.nama = nama;
    if (jurusanId) updateData.jurusanId = parseInt(jurusanId);
    
    const data = await prisma.programStudi.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/api/program-studi/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.programStudi.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Program Studi dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// --- KELAS ---
router.get("/api/kelas", authMiddleware, async (req, res) => {
  try {
    const data = await prisma.kelas.findMany({ include: { programStudi: { include: { jurusan: true } } } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/api/kelas", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nama_kelas, programStudiId } = req.body;
    const data = await prisma.kelas.create({ data: { nama_kelas, programStudiId: parseInt(programStudiId) } });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/api/kelas/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kelas, programStudiId } = req.body;
    const updateData = {};
    if (nama_kelas) updateData.nama_kelas = nama_kelas;
    if (programStudiId) updateData.programStudiId = parseInt(programStudiId);
    
    const data = await prisma.kelas.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/api/kelas/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.kelas.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Kelas dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
