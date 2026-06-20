const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "smartattendance_timdis_2024";

// =============================================
// MIDDLEWARE
// =============================================

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res
      .status(401)
      .json({ error: "Unauthorized. Silakan login terlebih dahulu." });
  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (err) {
    res
      .status(401)
      .json({ error: "Token tidak valid atau sudah kedaluwarsa." });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res
      .status(403)
      .json({
        error: "Akses ditolak. Hanya admin yang dapat mengakses fitur ini.",
      });
  }
  next();
};

module.exports = { authMiddleware, adminOnly };