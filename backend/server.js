require('dotenv').config();
const app = require('./src/app');
const PORT = process.env.PORT || 5000;

// Jalankan server HANYA di lokal (bukan di environment serverless)
const isServerless = process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
if (!isServerless && process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server Smart Attendance berjalan di port ${PORT}`);
  });
}

module.exports = app; // For serverless
