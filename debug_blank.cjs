const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
  
  // Set localStorage to simulate logged-in admin
  const user = { id: 1, username: 'TIMDIS1', role: 'ADMIN', name: 'Admin TIMDIS 1' };
  const token = 'fake-token';
  
  await page.evaluateOnNewDocument((user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  }, user, token);
  
  await page.goto('http://localhost:5174/admin', { waitUntil: 'networkidle2' });
  
  await browser.close();
})();
