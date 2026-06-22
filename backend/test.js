const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const jadwal = await prisma.jadwalApel.findMany();
  console.log('JADWAL:', jadwal);
}

main().catch(console.error).finally(() => prisma.$disconnect());
