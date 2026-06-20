require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { username: 'TIMDIS1' } });
  if (!user) { console.log('User TIMDIS1 tidak ditemukan!'); return; }
  
  const testPasswords = ['TIMDIS1', 'timdis1', 'admin', 'password', '123456'];
  for (const pw of testPasswords) {
    const match = await bcrypt.compare(pw, user.password);
    console.log(`  "${pw}" => ${match ? '✅ MATCH!' : '❌ tidak cocok'}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
