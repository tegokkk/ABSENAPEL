-- Clean duplicate attendance rows before enforcing one attendance per user per schedule.
DELETE FROM "Attendance" newer
USING "Attendance" older
WHERE newer."jadwalId" IS NOT NULL
  AND older."jadwalId" IS NOT NULL
  AND newer."userId" = older."userId"
  AND newer."jadwalId" = older."jadwalId"
  AND newer."id_absensi" > older."id_absensi";

-- Normalize existing free-text values before adding future-facing checks.
UPDATE "User" SET "role" = UPPER("role") WHERE "role" IS NOT NULL;
UPDATE "Attendance" SET "status" = UPPER("status") WHERE "status" IS NOT NULL;
UPDATE "PengajuanIzin" SET "status" = UPPER("status") WHERE "status" IS NOT NULL;
UPDATE "PengajuanIzin" SET "jenis_izin" = UPPER("jenis_izin") WHERE "jenis_izin" IS NOT NULL;

-- Keep only one active attendance location before enforcing the partial unique index.
WITH ranked_locations AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "is_default" DESC, "updated_at" DESC, "id" ASC) AS rank
  FROM "LokasiAbsen"
  WHERE "is_active" = true
)
UPDATE "LokasiAbsen"
SET "is_active" = false
WHERE "id" IN (
  SELECT "id" FROM ranked_locations WHERE rank > 1
);

-- Indexes and uniqueness guarantees used by the production routes.
CREATE UNIQUE INDEX "Attendance_userId_jadwalId_key" ON "Attendance"("userId", "jadwalId");
CREATE INDEX "Attendance_tanggal_idx" ON "Attendance"("tanggal");
CREATE INDEX "Attendance_created_at_idx" ON "Attendance"("created_at");
CREATE INDEX "Attendance_status_idx" ON "Attendance"("status");
CREATE INDEX "User_kelas_idx" ON "User"("kelas");
CREATE INDEX "User_kelasId_idx" ON "User"("kelasId");
CREATE INDEX "LokasiAbsen_is_active_idx" ON "LokasiAbsen"("is_active");
CREATE INDEX "LokasiAbsen_is_default_idx" ON "LokasiAbsen"("is_default");
CREATE UNIQUE INDEX "LokasiAbsen_single_active_idx" ON "LokasiAbsen"("is_active") WHERE "is_active" = true;
CREATE INDEX "JadwalApel_is_active_waktu_mulai_waktu_selesai_idx" ON "JadwalApel"("is_active", "waktu_mulai", "waktu_selesai");
CREATE INDEX "PengajuanIzin_userId_status_idx" ON "PengajuanIzin"("userId", "status");
CREATE INDEX "PengajuanIzin_created_at_idx" ON "PengajuanIzin"("created_at");

-- Check constraints keep new data in the expected application domain.
ALTER TABLE "User"
  ADD CONSTRAINT "User_role_check"
  CHECK ("role" IN ('ADMIN', 'MAHASISWA')) NOT VALID;

ALTER TABLE "Attendance"
  ADD CONSTRAINT "Attendance_status_check"
  CHECK ("status" IN ('HADIR', 'TERLAMBAT', 'PENDING')) NOT VALID;

ALTER TABLE "PengajuanIzin"
  ADD CONSTRAINT "PengajuanIzin_status_check"
  CHECK ("status" IN ('PENDING', 'APPROVED', 'REJECTED')) NOT VALID;

ALTER TABLE "PengajuanIzin"
  ADD CONSTRAINT "PengajuanIzin_jenis_izin_check"
  CHECK ("jenis_izin" IN ('SAKIT', 'IZIN', 'CUTI')) NOT VALID;

ALTER TABLE "PengajuanIzin"
  ADD CONSTRAINT "PengajuanIzin_tanggal_range_check"
  CHECK ("tanggal_akhir" >= "tanggal_awal") NOT VALID;

ALTER TABLE "JadwalApel"
  ADD CONSTRAINT "JadwalApel_waktu_range_check"
  CHECK ("waktu_selesai" > "waktu_mulai") NOT VALID;

ALTER TABLE "JadwalApel"
  ADD CONSTRAINT "JadwalApel_batas_terlambat_range_check"
  CHECK ("batas_terlambat" IS NULL OR ("batas_terlambat" >= "waktu_mulai" AND "batas_terlambat" <= "waktu_selesai")) NOT VALID;
