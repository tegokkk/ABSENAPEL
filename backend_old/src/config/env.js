const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  office: {
    lat: parseFloat(process.env.OFFICE_LAT) || -5.397140,
    lng: parseFloat(process.env.OFFICE_LNG) || 105.266789,
    radius: parseInt(process.env.OFFICE_RADIUS) || 100,
    name: process.env.OFFICE_NAME || 'Lapangan Apel Kampus',
  },
};

module.exports = config;
