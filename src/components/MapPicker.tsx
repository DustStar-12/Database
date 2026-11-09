import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@project/components/ui/input';
import { Button } from '@project/components/ui/button';

const DEFAULT: [number, number] = [33.8938, 35.5018];
const TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

function Recenter({ pos }: { pos: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(pos, Math.max(map.getZoom(), 14)); }, [pos[0], pos[1]]);
  return null;
}
function ClickPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: e => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export function MapView({ lat, lng, className }: { lat?: number | null; lng?: number | null; className?: string }) {
  const pos: [number, number] = lat != null && lng != null ? [lat, lng] : DEFAULT;
  return (
    <MapContainer center={pos} zoom={lat != null ? 15 : 11} className={className} scrollWheelZoom={false} attributionControl={false}>
      <TileLayer url={TILES} />
      {lat != null && <CircleMarker center={pos} radius={9} pathOptions={{ color: 'hsl(32 95% 58%)', fillOpacity: 0.7 }} />}
      <Recenter pos={pos} />
    </MapContainer>
  );
}

type Props = { address: string; lat: number | null; lng: number | null; onChange: (v: { address?: string; lat: number | null; lng: number | null }) => void };

export default function MapPicker({ address, lat, lng, onChange }: Props) {
  const [q, setQ] = useState(address);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  useEffect(() => setQ(address), [address]);

  const search = async () => {
    if (!q.trim()) return;
    setBusy(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`);
      setResults(await r.json());
    } finally { setBusy(false); }
  };
  const reverse = async (la: number, ln: number) => {
    onChange({ lat: la, lng: ln });
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${la}&lon=${ln}`);
      const j = await r.json();
      if (j.display_name) onChange({ address: j.display_name, lat: la, lng: ln });
    } catch { /* keep coords */ }
  };
  const pos: [number, number] = lat != null && lng != null ? [lat, lng] : DEFAULT;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); search(); } }} placeholder="Search an address, or click the map" />
        <Button type="button" variant="outline" size="icon" onClick={search}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
      </div>
      {results.length > 0 && (
        <ul className="border border-border max-h-40 overflow-y-auto text-sm">
          {results.map(r => (
            <li key={r.lat + r.lon}><button type="button" className="w-full text-left px-3 py-1.5 hover:bg-primary/10"
              onClick={() => { onChange({ address: r.display_name, lat: +r.lat, lng: +r.lon }); setResults([]); }}>{r.display_name}</button></li>
          ))}
        </ul>
      )}
      <MapContainer center={pos} zoom={lat != null ? 15 : 11} className="h-56 border border-primary/40" attributionControl={false}>
        <TileLayer url={TILES} />
        {lat != null && <CircleMarker center={pos} radius={9} pathOptions={{ color: 'hsl(32 95% 58%)', fillOpacity: 0.7 }} />}
        <Recenter pos={pos} />
        <ClickPick onPick={reverse} />
      </MapContainer>
      {lat != null && <p className="font-mono text-[11px] text-muted-foreground">{lat.toFixed(5)}° N, {lng!.toFixed(5)}° E</p>}
    </div>
  );
}
