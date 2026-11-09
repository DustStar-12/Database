import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Network, RotateCcw } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import type { Profile } from '../App';

type Node = { id: string; label: string; sub?: string; photo?: string; center?: boolean };

export default function ConnectionGraph({ friend, profiles, onClose, onOpenProfile }: {
  friend: { name: string; url: string; profileIds: string[] };
  profiles: Profile[]; onClose: () => void; onOpenProfile: (id: string) => void;
}) {
  const W = 1000, H = 640, cx = W / 2, cy = H / 2;
  const nodes: Node[] = [
    { id: '__f', label: friend.name, sub: 'MUTUAL CONNECTION', center: true },
    ...friend.profileIds.map(id => {
      const p = profiles.find(x => x.id === id);
      return { id, label: p?.fullName || 'Unnamed', sub: p?.nationality ?? 'PROFILE', photo: p?.photoUrl ?? undefined };
    }),
  ];
  const initial = () => {
    const r = Math.min(260, 120 + friend.profileIds.length * 25);
    const pos: Record<string, { x: number; y: number }> = { __f: { x: cx, y: cy } };
    friend.profileIds.forEach((id, i) => {
      const a = (i / friend.profileIds.length) * Math.PI * 2 - Math.PI / 2;
      pos[id] = { x: cx + Math.cos(a) * r * 1.4, y: cy + Math.sin(a) * r };
    });
    return pos;
  };
  const [pos, setPos] = useState(initial);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ id: string | null; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && (e.stopPropagation(), onClose());
    window.addEventListener('keydown', k, true); return () => window.removeEventListener('keydown', k, true);
  }, [onClose]);

  const scale = () => { const r = svg.current!.getBoundingClientRect(); return W / r.width; };
  const down = (e: React.PointerEvent, id: string | null) => {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const o = id ? pos[id] : pan;
    drag.current = { id, sx: e.clientX, sy: e.clientY, ox: o.x, oy: o.y, moved: false };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    const s = scale(), dx = (e.clientX - d.sx) * s, dy = (e.clientY - d.sy) * s;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    if (d.id) setPos(p => ({ ...p, [d.id!]: { x: d.ox + dx, y: d.oy + dy } }));
    else setPan({ x: d.ox + dx, y: d.oy + dy });
  };
  const up = () => {
    const d = drag.current; drag.current = null;
    if (d?.id && d.id !== '__f' && !d.moved) onOpenProfile(d.id);
  };

  const arc = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y;
    return `M${a.x},${a.y} Q${mx - dy * 0.25},${my + dx * 0.25} ${b.x},${b.y}`;
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm p-3 md:p-5 flex flex-col">
      <div className="holo-panel px-4 py-2 flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="font-display text-primary glow-text flex items-center gap-2"><Network className="h-5 w-5" />CONNECTION TREE</h2>
          <p className="font-mono text-[11px] text-muted-foreground">{friend.name} · {friend.url} · LINKED PROFILES: {friend.profileIds.length}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" title="Reset layout" onClick={() => { setPos(initial()); setPan({ x: 0, y: 0 }); }}><RotateCcw className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="holo-panel flex-1 min-h-0 overflow-hidden">
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full h-full touch-none select-none cursor-grab active:cursor-grabbing"
          onPointerDown={e => down(e, null)} onPointerMove={move} onPointerUp={up}>
          <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <radialGradient id="core"><stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.9" /><stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.1" /></radialGradient>
            {nodes.map(n => n.photo && <clipPath key={n.id} id={`c-${n.id}`}><circle r="30" /></clipPath>)}
          </defs>
          <g transform={`translate(${pan.x},${pan.y})`}>
            {[120, 220, 320].map(r => <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--primary))" strokeOpacity="0.08" strokeDasharray="4 8" />)}
            {friend.profileIds.map((id, i) => {
              const d = arc(pos.__f, pos[id]);
              return (
                <g key={'e' + id}>
                  <path d={d} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeOpacity="0.85" filter="url(#glow)" />
                  <path d={d} fill="none" stroke="hsl(var(--accent))" strokeWidth="2" strokeDasharray="6 14">
                    <animate attributeName="stroke-dashoffset" from="40" to="0" dur={`${1.2 + i * 0.15}s`} repeatCount="indefinite" />
                  </path>
                </g>
              );
            })}
            {nodes.map(n => {
              const p = pos[n.id];
              return (
                <g key={n.id} transform={`translate(${p.x},${p.y})`} style={{ cursor: 'move' }} onPointerDown={e => down(e, n.id)}>
                <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}>
                  {n.center ? <>
                    <circle r="54" fill="url(#core)" opacity="0.4"><animate attributeName="r" values="46;60;46" dur="2.5s" repeatCount="indefinite" /></circle>
                    <circle r="36" fill="hsl(var(--card))" stroke="hsl(var(--accent))" strokeWidth="3" filter="url(#glow)" />
                    <foreignObject x="-14" y="-14" width="28" height="28"><User className="h-7 w-7 text-accent" /></foreignObject>
                  </> : <>
                    <circle r="36" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2.5" filter="url(#glow)" />
                    {n.photo ? <image href={n.photo} x="-30" y="-30" width="60" height="60" preserveAspectRatio="xMidYMid slice" clipPath={`url(#c-${n.id})`} />
                      : <text textAnchor="middle" dy="7" fontFamily="Orbitron" fontSize="18" fill="hsl(var(--primary))">{n.label.split(' ').map(w => w[0]).slice(0, 2).join('')}</text>}
                  </>}
                  <text y="56" textAnchor="middle" fontFamily="Rajdhani" fontWeight="700" fontSize="16" fill={n.center ? 'hsl(var(--accent))' : 'hsl(var(--foreground))'}>{n.label}</text>
                  <text y="72" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="10" fill="hsl(var(--muted-foreground))">{(n.sub ?? '').toUpperCase()}</text>
                </motion.g></g>
              );
            })}
          </g>
        </svg>
      </div>
      <p className="text-center font-mono text-[11px] text-muted-foreground mt-2">DRAG NODES TO REARRANGE · DRAG BACKGROUND TO PAN · CLICK A PROFILE TO OPEN IT</p>
    </div>
  );
}
