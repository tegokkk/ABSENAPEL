// backend/seed.js
// Jalankan dengan: node seed.js (dari folder backend)
// Script ini koneksi langsung ke Supabase tanpa batas waktu

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seed database...\n");

  // 1. Hapus semua data lama
  console.log("🗑️  Menghapus data lama...");
  await prisma.attendance.deleteMany();
  await prisma.user.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.lokasiAbsen.deleteMany();
  await prisma.kelas.deleteMany();
  await prisma.programStudi.deleteMany();
  await prisma.jurusan.deleteMany();
  console.log("   ✅ Data lama dihapus\n");

  // 2. Settings default
  console.log("⚙️  Membuat settings default...");
  const defaultSettings = [
    { key: "BATAS_TERLAMBAT", value: "08:00" },
  ];
  for (const s of defaultSettings) {
    await prisma.settings.create({ data: s });
  }
  console.log("   ✅ Settings dibuat\n");

  // 3. Lokasi default
  console.log("📍 Membuat lokasi default...");
  await prisma.lokasiAbsen.create({
    data: {
      nama_lokasi: "Lapangan GSG Polinela",
      latitude: -5.3569503,
      longitude: 105.2317229,
      radius_meter: 100,
      is_active: true,
      is_default: true,
    },
  });
  console.log("   ✅ Lokasi default dibuat (Lapangan GSG Polinela)\n");

  // 4. Master Data Akademik
  console.log("🏫 Membuat Master Data Akademik...");
  const jurusan = await prisma.jurusan.create({
    data: { nama: "Teknologi Informasi", singkatan: "TI" }
  });
  const programStudi = await prisma.programStudi.create({
    data: { nama: "Manajemen Informatika", jurusanId: jurusan.id }
  });
  
  const kelasMI4A = await prisma.kelas.create({ data: { nama_kelas: "MI 4A", programStudiId: programStudi.id } });
  const kelasMI4B = await prisma.kelas.create({ data: { nama_kelas: "MI 4B", programStudiId: programStudi.id } });
  const kelasMI4C = await prisma.kelas.create({ data: { nama_kelas: "MI 4C", programStudiId: programStudi.id } });
  const kelasMI4D = await prisma.kelas.create({ data: { nama_kelas: "MI 4D", programStudiId: programStudi.id } });
  
  const kelasMap = {
    "MI 4A": kelasMI4A.id,
    "MI 4B": kelasMI4B.id,
    "MI 4C": kelasMI4C.id,
    "MI 4D": kelasMI4D.id,
  };
  console.log("   ✅ Master data akademik dibuat\n");

  // 5. Admin
  console.log("👔 Membuat akun admin...");
  const admins = [
    { username: "TIMDIS1", password: "TIMDIS1", name: "Admin TIMDIS 1" },
    { username: "TIMDIS2", password: "TIMDIS2", name: "Admin TIMDIS 2" },
  ];
  for (const admin of admins) {
    const hashedPw = await bcrypt.hash(admin.password, 10);
    await prisma.user.upsert({
      where:  { username: admin.username },
      update: {},
      create: { username: admin.username, password: hashedPw, name: admin.name, role: "ADMIN", kelas: null, npm: null },
    });
    console.log(`   ✅ Admin ${admin.username} dibuat`);
  }
  console.log();

  // 6. Mahasiswa
  const students = [
    // ===== MI 4A =====
    { name: "Abdur Rouf Hanafi",          npm: "24781001", kelas: "MI 4A" },
    { name: "Ahmad Rizky Maulana",         npm: "24781002", kelas: "MI 4A" },
    { name: "Alzahra Dwi Febriyan",        npm: "24781003", kelas: "MI 4A" },
    { name: "Atta Zaky Ramadhan",          npm: "24781004", kelas: "MI 4A" },
    { name: "Bunga Putri Salsabilla",      npm: "24781005", kelas: "MI 4A" },
    { name: "Dafa Anggara Yonata",         npm: "24781006", kelas: "MI 4A" },
    { name: "Deni Prawira",                npm: "24781007", kelas: "MI 4A" },
    { name: "Dona Virza",                  npm: "24781008", kelas: "MI 4A" },
    { name: "Fahmi Ghozali",               npm: "24781009", kelas: "MI 4A" },
    { name: "Farhan Habibullah",           npm: "24781010", kelas: "MI 4A" },
    { name: "Fitri Amelia Ananti",         npm: "24781011", kelas: "MI 4A" },
    { name: "Heidy Putri Shafira",         npm: "24781012", kelas: "MI 4A" },
    { name: "Jesfitrina Sihombing",        npm: "24781013", kelas: "MI 4A" },
    { name: "Lia Agustina",                npm: "24781014", kelas: "MI 4A" },
    { name: "M. Rayhan Zulkarnain",        npm: "24781015", kelas: "MI 4A" },
    { name: "Muhammad Alwan Dzaky",        npm: "24781016", kelas: "MI 4A" },
    { name: "Nabila Alfi Nur Khasanah",    npm: "24781017", kelas: "MI 4A" },
    { name: "Nadiya Ghefira El Firsi",     npm: "24781018", kelas: "MI 4A" },
    { name: "Nayla Putri Syafira Arrovi",  npm: "24781019", kelas: "MI 4A" },
    { name: "Nyken Sekar Ayuningtyas",     npm: "24781020", kelas: "MI 4A" },
    { name: "Rafi Diandra Ardi Agusta",    npm: "24781021", kelas: "MI 4A" },
    { name: "Rendy Dwi Prayoga",           npm: "24781022", kelas: "MI 4A" },
    { name: "Rifki Rangga Saputra",        npm: "24781023", kelas: "MI 4A" },
    { name: "Rizki Surohman",              npm: "24781024", kelas: "MI 4A" },
    { name: "Rubby Ibnu Anantara",         npm: "24781025", kelas: "MI 4A" },
    { name: "Septi Cahyaningtias",         npm: "24781026", kelas: "MI 4A" },
    { name: "Sofi Ramadhani",              npm: "24781027", kelas: "MI 4A" },
    { name: "Tasya Rismala",               npm: "24781028", kelas: "MI 4A" },
    { name: "Ulfa Setyaningsih",           npm: "24781029", kelas: "MI 4A" },
    { name: "Yoga Ricky Pasaribu",         npm: "24781030", kelas: "MI 4A" },
    { name: "Yusuf Al Fikri Jayasena",     npm: "24781031", kelas: "MI 4A" },
    // ===== MI 4B =====
    { name: "Dina Aulia Nursabita",                npm: "23753095", kelas: "MI 4B" },
    { name: "Adi Putra Cahya Gumilang",            npm: "24781032", kelas: "MI 4B" },
    { name: "Aidil Yosef",                         npm: "24781033", kelas: "MI 4B" },
    { name: "Arfandy Jhuliansyah",                 npm: "24781034", kelas: "MI 4B" },
    { name: "Desty Angelina",                      npm: "24781038", kelas: "MI 4B" },
    { name: "Egi Rivaldi",                         npm: "24781039", kelas: "MI 4B" },
    { name: "Fajri Kurniawan",                     npm: "24781040", kelas: "MI 4B" },
    { name: "Faris Alfarezi Riatmoko",             npm: "24781041", kelas: "MI 4B" },
    { name: "Frans Yuda Rizki Pramudya",           npm: "24781042", kelas: "MI 4B" },
    { name: "Ilham Kurniawan Rizki",               npm: "24781043", kelas: "MI 4B" },
    { name: "Jonatan Danang Eka Saputra Turnip",   npm: "24781044", kelas: "MI 4B" },
    { name: "M. Berlian Syasmita",                 npm: "24781045", kelas: "MI 4B" },
    { name: "Muhammad Farid Al Ikhsan",            npm: "24781047", kelas: "MI 4B" },
    { name: "Nabila Rizky Ilahi",                  npm: "24781048", kelas: "MI 4B" },
    { name: "Naifah Aini Zahra",                   npm: "24781049", kelas: "MI 4B" },
    { name: "Nofidyandra Sitorus",                 npm: "24781050", kelas: "MI 4B" },
    { name: "Orlean Wonkly Khatulistiwa",          npm: "24781051", kelas: "MI 4B" },
    { name: "Rangga Hazirathul Qudsiah",           npm: "24781052", kelas: "MI 4B" },
    { name: "Reza Fahmi Alkhamdani",               npm: "24781053", kelas: "MI 4B" },
    { name: "Ririn Agustina",                      npm: "24781054", kelas: "MI 4B" },
    { name: "Salsa Dwi Avrillia",                  npm: "24781056", kelas: "MI 4B" },
    { name: "Shakinah Zulayni",                    npm: "24781057", kelas: "MI 4B" },
    { name: "Sri Panenti Viditona Lubis",          npm: "24781058", kelas: "MI 4B" },
    { name: "Tego Saputra",                        npm: "24781059", kelas: "MI 4B" },
    { name: "Umi Khoirullatifah",                  npm: "24781060", kelas: "MI 4B" },
    // ===== MI 4C =====
    { name: "Affan Fazle Mawla",               npm: "24781063", kelas: "MI 4C" },
    { name: "Az Zahra Juas Dinda Dinata",      npm: "24781066", kelas: "MI 4C" },
    { name: "Citra Zainah Az-Zahra",           npm: "24781067", kelas: "MI 4C" },
    { name: "Dede Aulya Ramadhan",             npm: "24781068", kelas: "MI 4C" },
    { name: "Devnis Arga Vanis Setiawan",      npm: "24781069", kelas: "MI 4C" },
    { name: "Eka Nursani",                     npm: "24781070", kelas: "MI 4C" },
    { name: "Fatir Kausar",                    npm: "24781072", kelas: "MI 4C" },
    { name: "Gilang Ardyan Wijaya",            npm: "24781073", kelas: "MI 4C" },
    { name: "Imarotul Hafidzoh",               npm: "24781074", kelas: "MI 4C" },
    { name: "M.Chaesar Abdullah",              npm: "24781076", kelas: "MI 4C" },
    { name: "Muhammad Putara Meca Abzanro",    npm: "24781078", kelas: "MI 4C" },
    { name: "Nabila Ramadhani",                npm: "24781079", kelas: "MI 4C" },
    { name: "Nandito Prabu Pratama",           npm: "24781080", kelas: "MI 4C" },
    { name: "Nur Aziza",                       npm: "24781081", kelas: "MI 4C" },
    { name: "Putri Sari Rizkiyah",             npm: "24781082", kelas: "MI 4C" },
    { name: "Rasyida Messy Hidayat",           npm: "24781083", kelas: "MI 4C" },
    { name: "Riani Azzahra Saridewi",          npm: "24781084", kelas: "MI 4C" },
    { name: "Rizqi Akbar",                     npm: "24781086", kelas: "MI 4C" },
    { name: "Sania Karima",                    npm: "24781087", kelas: "MI 4C" },
    { name: "Shofiyyah Nabila Putri",          npm: "24781088", kelas: "MI 4C" },
    { name: "Yuda Aditya Putra",               npm: "24781092", kelas: "MI 4C" },
    // ===== MI 4D =====
    { name: "Ahmad Muhajir",                      npm: "24781093", kelas: "MI 4D" },
    { name: "Alya Alfi Lutfiah",                  npm: "24781094", kelas: "MI 4D" },
    { name: "Atha Talitha Nabil",                 npm: "24781095", kelas: "MI 4D" },
    { name: "Cosmas Septiano",                    npm: "24781097", kelas: "MI 4D" },
    { name: "Dewi Rahma Agustina",                npm: "24781099", kelas: "MI 4D" },
    { name: "Elya Dianis",                        npm: "24781100", kelas: "MI 4D" },
    { name: "Farah Sulistia",                     npm: "24781101", kelas: "MI 4D" },
    { name: "Fiqa Khairunisa",                    npm: "24781102", kelas: "MI 4D" },
    { name: "Govin Gautama",                      npm: "24781103", kelas: "MI 4D" },
    { name: "Jeni Amanda",                        npm: "24781104", kelas: "MI 4D" },
    { name: "Kurnia Wati Fadhilah",               npm: "24781105", kelas: "MI 4D" },
    { name: "M. Haidir Septian",                  npm: "24781106", kelas: "MI 4D" },
    { name: "Muhammad Akbar Husni Harun",         npm: "24781107", kelas: "MI 4D" },
    { name: "Musa Mushthofaynal Abror Almishry A",npm: "24781108", kelas: "MI 4D" },
    { name: "Nadina Putri Khairani",              npm: "24781109", kelas: "MI 4D" },
    { name: "Nandy Thaher Ulga",                  npm: "24781110", kelas: "MI 4D" },
    { name: "Nurul Aliya",                        npm: "24781111", kelas: "MI 4D" },
    { name: "Raffi Ramadhan Oktaviansyah",        npm: "24781112", kelas: "MI 4D" },
    { name: "Refha Ardinata M.Noer",              npm: "24781113", kelas: "MI 4D" },
    { name: "Riski Amalia",                       npm: "24781115", kelas: "MI 4D" },
    { name: "Sarifah Elizabeth Simamora",         npm: "24781116", kelas: "MI 4D" },
    { name: "Silvia Nanda Agustin",               npm: "24781117", kelas: "MI 4D" },
    { name: "Tri Rizki Amelia",                   npm: "24781119", kelas: "MI 4D" },
    { name: "Yayuk Febriat Praba",                npm: "24781120", kelas: "MI 4D" },
    { name: "Ahmad Aslamsyah Attoria",            npm: "24781122", kelas: "MI 4D" },
  ];

  console.log(`👨‍🎓 Membuat ${students.length} mahasiswa...`);
  let count = 0;
  for (const student of students) {
    const hashedPw = await bcrypt.hash(student.npm, 10);
    await prisma.user.upsert({
      where:  { username: student.name },
      update: {},
      create: {
        username: student.name,
        password: hashedPw,
        name:     student.name,
        npm:      student.npm,
        kelas:    student.kelas,
        kelasId:  kelasMap[student.kelas] || null,
        role:     "MAHASISWA",
      },
    });
    count++;
    process.stdout.write(`\r   ✅ ${count}/${students.length} mahasiswa dibuat`);
  }

  console.log(`\n\n🎉 Seed selesai!`);
  console.log(`   Admin   : 2 (TIMDIS1, TIMDIS2)`);
  console.log(`   Mahasiswa: ${students.length}`);
  console.log(`   Kelas   : MI 4A (31), MI 4B (25), MI 4C (21), MI 4D (25)`);
  console.log(`   Lokasi Default: Lapangan GSG Polinela`);
}

main()
  .catch((e) => {
    console.error("\n❌ Seed gagal:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
