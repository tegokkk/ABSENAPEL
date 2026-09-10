import { CalendarCheck } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';
import Badge from '../ui/Badge';
import Table, { EmptyRow } from '../ui/Table';
import { formatWibDate, formatWibTime } from '../../utils/dateTime';

const formatDate = (value) => formatWibDate(value, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const formatTime = (value) => value ? formatWibTime(value) : '-';

function AttendanceStatus({ status }) {
  return (
    <Badge variant={status === 'TERLAMBAT' ? 'warning' : 'success'}>
      {status === 'TERLAMBAT' ? 'Terlambat' : 'Hadir'}
    </Badge>
  );
}

export default function AttendanceHistory({ attendances }) {
  return (
    <Card>
      <CardHeader title="Riwayat Absensi" subtitle="Tanggal dan waktu ditampilkan dalam WIB." />
      <div className="block md:hidden">
        {attendances.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CalendarCheck size={20} /></div>
            <p className="empty-state-text">Belum ada riwayat absensi.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attendances.map((attendance) => (
              <div key={attendance.id_absensi} className="rounded-lg border border-[var(--border-light)] bg-white/[.025] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-primary">{formatDate(attendance.tanggal)}</p>
                    <p className="mt-1 text-xs font-mono text-secondary">{formatTime(attendance.jam_absen)}</p>
                  </div>
                  <AttendanceStatus status={attendance.status} />
                </div>
                {attendance.foto_selfie && (
                  <a href={attendance.foto_selfie} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-xs font-semibold text-accent-400">
                    Lihat foto selfie
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="hidden md:block">
        <Table headers={[{ label: 'Tanggal' }, { label: 'Waktu Absen' }, { label: 'Status' }, { label: 'Foto' }]}>
          {attendances.length === 0 ? (
            <EmptyRow colSpan={4} message="Belum ada riwayat absensi." />
          ) : (
            attendances.map((attendance) => (
              <tr key={attendance.id_absensi}>
                <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(attendance.tanggal)}</td>
                <td className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{formatTime(attendance.jam_absen)}</td>
                <td><AttendanceStatus status={attendance.status} /></td>
                <td>
                  {attendance.foto_selfie ? (
                    <a href={attendance.foto_selfie} target="_blank" rel="noopener noreferrer">
                      <img
                        src={attendance.foto_selfie}
                        alt={`Selfie absensi ${formatDate(attendance.tanggal)}`}
                        className="w-10 h-10 rounded-xl object-cover cursor-pointer hover:scale-110 transition-transform"
                        style={{ border: '2px solid var(--border)' }}
                        onMouseEnter={(event) => { event.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'; }}
                        onMouseLeave={(event) => { event.currentTarget.style.borderColor = 'var(--border)'; }}
                      />
                    </a>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </Table>
      </div>
    </Card>
  );
}
