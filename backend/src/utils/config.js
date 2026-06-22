function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET wajib diisi di environment production.");
  }

  return "smartattendance_timdis_2024_dev";
}

module.exports = { getJwtSecret };
