import { formatWibDate, formatWibTime, getWibDateKey } from '../utils/dateTime';

// Report libraries are loaded only when the user requests an export.
export async function createAttendanceWorkbook(attendances, selectedKelas) {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheetName = !selectedKelas || selectedKelas === 'Semua Kelas' ? 'Semua Data' : selectedKelas;
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Nama Mahasiswa', key: 'nama', width: 30 },
    { header: 'NPM', key: 'npm', width: 15 },
    { header: 'Kelas', key: 'kelas', width: 12 },
    { header: 'Tanggal', key: 'tanggal', width: 15 },
    { header: 'Waktu Absen', key: 'jam_absen', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'IP Address', key: 'ip', width: 15 },
    { header: 'Browser & Platform', key: 'device', width: 25 },
  ];

  sheet.getRow(1).eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  attendances.forEach((a, index) => {
    const row = sheet.addRow({
      no: index + 1,
      nama: a.user.name,
      npm: a.user.npm || '-',
      kelas: a.user.kelas || '-',
      tanggal: formatWibDate(a.tanggal),
      jam_absen: a.jam_absen ? formatWibTime(a.jam_absen) : '-',
      status: a.status,
      ip: a.ip_address || '-',
      device: `${a.browser || '-'} / ${a.platform || '-'}`,
    });
    if (a.status === 'TERLAMBAT') {
      row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      row.getCell('status').font = { color: { argb: 'FFD97706' }, bold: true };
    } else {
      row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      row.getCell('status').font = { color: { argb: 'FF059669' }, bold: true };
    }
  });

  return workbook;
}

export async function createAttendancePdf(attendances, selectedKelas) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'), import('jspdf-autotable'),
  ]);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const filterLabel = !selectedKelas || selectedKelas === 'Semua Kelas' ? 'Semua Kelas' : selectedKelas;
  const today = formatWibDate(new Date(), { day: '2-digit', month: 'long', year: 'numeric' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Rekap Absensi Mahasiswa', 148, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Smart Attendance - Manajemen Informatika', 148, 22, { align: 'center' });
  doc.setFontSize(9);
  doc.text(`Kelas: ${filterLabel}  |  Tanggal Cetak: ${today}`, 148, 28, { align: 'center' });

  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(0.5);
  doc.line(14, 31, 283, 31);

  const tableData = attendances.map((a, i) => [
    i + 1,
    a.user.name,
    a.user.kelas || '-',
    formatWibDate(a.tanggal),
    a.jam_absen ? formatWibTime(a.jam_absen) : '-',
    a.status === 'TERLAMBAT' ? 'Terlambat' : 'Hadir'
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['No', 'Nama Mahasiswa', 'Kelas', 'Tanggal', 'Waktu Absen', 'Status']],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.1 },
    headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { cellWidth: 80 },
      2: { halign: 'center', cellWidth: 30 },
      3: { halign: 'center', cellWidth: 40 },
      4: { halign: 'center', cellWidth: 40 },
      5: { halign: 'center', cellWidth: 30 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        if (data.cell.raw === 'Terlambat') {
          data.cell.styles.textColor = [217, 119, 6];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Halaman ${i} dari ${pageCount}`, 283, 200, { align: 'right' });
    doc.text(`Dicetak oleh Smart Attendance`, 14, 200);
  }

  return doc;
}

function reportFilename(selectedKelas, extension) {
  const label = !selectedKelas || selectedKelas === 'Semua Kelas' ? 'Semua_Kelas' : selectedKelas.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `absensi_${label}_${getWibDateKey()}.${extension}`;
}

export async function downloadAttendanceExcel(attendances, selectedKelas) {
  const workbook = await createAttendanceWorkbook(attendances, selectedKelas);
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = reportFilename(selectedKelas, 'xlsx');
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Let the browser start the download before releasing the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadAttendancePdf(attendances, selectedKelas) {
  const doc = await createAttendancePdf(attendances, selectedKelas);
  doc.save(reportFilename(selectedKelas, 'pdf'));
}
