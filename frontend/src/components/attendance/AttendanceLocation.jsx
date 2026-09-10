import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Loader2, MapPin } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';
import Button from '../ui/Button';

const mapMarkerIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function AttendanceLocation({ location, error, locating, onRefresh, settings }) {
  const officeCoord = [settings.OFFICE_LAT, settings.OFFICE_LON];

  return (
    <Card>
      <CardHeader
        title="Lokasi Saat Ini"
        action={
          <Button id="btn-refresh-location" onClick={onRefresh} disabled={locating} variant="secondary" size="sm">
            {locating ? <Loader2 size={13} className="animate-spin" /> : <MapPin size={13} />}
            {locating ? 'Mencari...' : 'Perbarui'}
          </Button>
        }
      />
      {error && (
        <div role="alert" className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
          {error}
        </div>
      )}
      <div className="relative z-0 h-72 overflow-hidden rounded-xl sm:h-80" style={{ border: '1px solid var(--border)', background: 'var(--bg-base)' }}>
        {location ? (
          <MapContainer center={[location.lat, location.lng]} zoom={16} style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[location.lat, location.lng]} icon={mapMarkerIcon}>
              <Popup>Lokasi Anda</Popup>
            </Marker>
            <Circle center={officeCoord} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.15 }} radius={Number(settings.MAX_RADIUS)} />
            <Marker position={officeCoord} icon={mapMarkerIcon}>
              <Popup>Lokasi Apel</Popup>
            </Marker>
          </MapContainer>
        ) : (
          <div role="status" className="flex flex-col items-center justify-center h-full gap-2" style={{ color: 'var(--text-muted)' }}>
            <MapPin size={30} strokeWidth={1.5} />
            <span className="text-sm">{locating ? 'Memuat lokasi...' : 'Lokasi belum tersedia. Klik Perbarui untuk mencoba lagi.'}</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {[
          { label: 'Latitude', value: location?.lat?.toFixed(6) || '-' },
          { label: 'Longitude', value: location?.lng?.toFixed(6) || '-' },
          { label: 'Akurasi', value: location?.accuracy != null ? `±${location.accuracy.toFixed(0)}m` : '-' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg p-2.5 text-center" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-xs font-mono font-semibold" style={{ color: 'var(--text-secondary)' }}>{value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
