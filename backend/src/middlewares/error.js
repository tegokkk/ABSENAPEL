/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan pada server';

  // Prisma Errors
  if (err.code === 'P2002') {
    return res.status(400).json({ error: 'Data sudah ada (Unique constraint failed)' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Data tidak ditemukan' });
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Async Handler Wrapper untuk menghindari try-catch berulang
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler
};
