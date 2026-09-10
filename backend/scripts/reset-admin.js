require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Cek admin users
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  console.log('Admin found:', admins.length);
  for (const admin of admins) {
    console.log(`  username: ${admin.username}, password_hash: ${admin.password.slice(0, 30)}...`);
  }
  
  // Reset password admin
  const adminPasswordHash = await bcrypt.hash('APEL123', 10);
  
  await prisma.user.upsert({
    where: { username: 'TIMDIS1' },
    update: { password: adminPasswordHash },
    create: { username: 'TIMDIS1', password: adminPasswordHash, name: 'Admin TIMDIS 1', role: 'ADMIN' }
  });
  await prisma.user.upsert({
    where: { username: 'TIMDIS2' },
    update: { password: adminPasswordHash },
    create: { username: 'TIMDIS2', password: adminPasswordHash, name: 'Admin TIMDIS 2', role: 'ADMIN' }
  });
  
  console.log('\n✅ Password TIMDIS1 dan TIMDIS2 berhasil direset!');
  console.log('   Login: TIMDIS1 / APEL123');
  console.log('   Login: TIMDIS2 / APEL123');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
