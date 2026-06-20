// netlify/functions/api.js
// Wrapper serverless-http agar Express bisa berjalan di Netlify Functions

const serverless = require("serverless-http");

// Load Express app dari backend modular
const app = require("../../backend/src/app.js");

// Export handler untuk Netlify
module.exports.handler = serverless(app);
