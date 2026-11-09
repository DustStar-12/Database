import type { Profile } from '../App';
import { cn } from '@project/components/lib/utils';
import { profileCode } from '../lib/fields';

export default function ProfileList({ profiles, selectedId, onSelect }: { profiles: Profile[]; selectedId: string | null; onSelect: (id: string) => void }) {
  if (!profiles.length) return <p className="text-center text-muted-foreground font-mono text-xs py-8">NO MATCHING RECORDS</p>;
  return (
    <ul className="space-y-1.5 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
      {profiles.map(p => (
        <li key={p.id}>
          <button onClick={() => onSelect(p.id)} className={cn(
            'w-full text-left px-3 py-2 border transition-all flex items-center gap-3',
            p.id === selectedId ? 'border-primary bg-primary/10 shadow-[0_0_14px_hsl(var(--primary)/0.3)]' : 'border-border/40 hover:border-primary/60 hover:bg-primary/5')}>
            <div className="h-10 w-9 shrink-0 grid place-items-center border border-primary/50 font-display text-xs text-primary overflow-hidden">
              {p.photoUrl ? <img src={p.photoUrl} className="h-full w-full object-cover" /> : (p.fullName ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate">{p.fullName || 'Unnamed'}</div>
              <div className="font-mono text-[10px] text-muted-foreground">{profileCode(p.id)}{p.nationality ? ` · ${p.nationality}` : ''}</div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
