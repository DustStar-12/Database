import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { X, Search, Users, Trash2, Link2 } from 'lucide-react';
import { listFriends, deleteFriend, ListFriendsOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Skeleton } from '@project/components/ui/skeleton';
import { Badge } from '@project/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import type { Profile } from '../App';
import ConnectionGraph from './ConnectionGraph';

type Friend = ListFriendsOutputType['friends'][0];
type Group = { url: string; name: string; entries: Friend[]; profileIds: string[] };

export default function FriendsView({ profiles, focusId, onClose, onOpenProfile }: {
  profiles: Profile[]; focusId?: string | null; onClose: () => void; onOpenProfile: (id: string) => void;
}) {
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [tab, setTab] = useState<'all' | 'mutual'>(focusId ? 'mutual' : 'all');
  const [focus, setFocus] = useState<string>(focusId ?? 'any');
  const [q, setQ] = useState('');
  const [graph, setGraph] = useState<Group | null>(null);
  const names = useMemo(() => Object.fromEntries(profiles.map(p => [p.id, p.fullName || 'Unnamed'])), [profiles]);

  useEffect(() => { listFriends({}).then(r => setFriends(r.friends.filter(f => names[f.profileId]))).catch(() => { toast.error('Failed to load friends'); setFriends([]); }); }, []);

  const groups = useMemo(() => {
    const m = new Map<string, Group>();
    for (const f of friends ?? []) {
      const g = m.get(f.url) ?? { url: f.url, name: f.name, entries: [], profileIds: [] };
      g.entries.push(f); if (!g.profileIds.includes(f.profileId)) g.profileIds.push(f.profileId);
      m.set(f.url, g);
    }
    const t = q.toLowerCase();
    return [...m.values()]
      .filter(g => focus === 'any' || g.profileIds.includes(focus))
      .filter(g => tab === 'all' || g.profileIds.length > 1)
      .filter(g => !t || g.name.toLowerCase().includes(t) || g.url.includes(t))
      .sort((a, b) => b.profileIds.length - a.profileIds.length || a.name.localeCompare(b.name));
  }, [friends, focus, tab, q]);

  const remove = async (g: Group) => {
    const ids = g.entries.filter(e => focus === 'any' || e.profileId === focus).map(e => e.id);
    setFriends(fs => fs!.filter(f => !ids.includes(f.id)));
    try { await Promise.all(ids.map(id => deleteFriend({ id }))); } catch { toast.error('Delete failed'); }
  };

  return (
    <div data-friends className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-3 md:p-5 flex flex-col">
      <div className="holo-panel px-4 py-2 flex flex-wrap items-center gap-3 justify-between mb-3">
        <h2 className="font-display text-primary glow-text flex items-center gap-2"><Users className="h-5 w-5" />FACEBOOK FRIENDS DATABASE</h2>
        <Button variant="outline" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <Tabs value={tab} onValueChange={v => setTab(v as any)}>
          <TabsList><TabsTrigger value="all">All friends</TabsTrigger><TabsTrigger value="mutual">Mutual connections</TabsTrigger></TabsList>
        </Tabs>
        <Select value={focus} onValueChange={setFocus}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="any">All profiles</SelectItem>
            {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName || 'Unnamed'}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or URL…" className="pl-9" />
        </div>
      </div>
      <div className="holo-panel flex-1 min-h-0 overflow-y-auto">
        {friends === null ? <div className="p-3 space-y-2">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-10" />)}</div>
          : !groups.length ? <p className="text-center text-muted-foreground font-mono text-xs py-16">{tab === 'mutual' ? 'NO MUTUAL CONNECTIONS FOUND' : 'NO FRIENDS UPLOADED — UPLOAD A SHEET FROM A PROFILE’S EDIT FORM'}</p>
          : <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card"><tr className="text-left text-[11px] uppercase tracking-wider text-accent">
                <th className="px-3 py-2">Name</th><th className="px-3 py-2">Facebook URL</th><th className="px-3 py-2">Connected profiles</th><th className="w-10" />
              </tr></thead>
              <tbody>{groups.map(g => (
                <tr key={g.url} onClick={() => g.profileIds.length > 1 && setGraph(g)} className={`border-t border-border/30 hover:bg-primary/5 ${g.profileIds.length > 1 ? 'cursor-pointer' : ''}`}>
                  <td className="px-3 py-2 font-semibold">{g.name}{g.profileIds.length > 1 && <Badge className="ml-2 bg-accent text-accent-foreground">MUTUAL ×{g.profileIds.length}</Badge>}{g.profileIds.length > 1 && <span className="ml-2 text-[10px] font-mono text-primary">VIEW TREE ›</span>}</td>
                  <td className="px-3 py-2 font-mono text-xs break-all"><a onClick={e => e.stopPropagation()} href={`https://${g.url}`} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1"><Link2 className="h-3 w-3 shrink-0" />{g.url}</a></td>
                  <td className="px-3 py-2"><div className="flex flex-wrap gap-1">{g.profileIds.map(id => (
                    <button key={id} onClick={e => { e.stopPropagation(); onOpenProfile(id); }} className="border border-primary/50 px-2 py-0.5 text-xs hover:bg-primary/15">{names[id]}</button>
                  ))}</div></td>
                  <td className="px-2"><Button variant="ghost" size="icon" title={focus === 'any' ? 'Delete everywhere' : 'Remove from this profile'} onClick={e => { e.stopPropagation(); remove(g); }}><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}</tbody>
            </table>}
      </div>
      {graph && <ConnectionGraph friend={graph} profiles={profiles} onClose={() => setGraph(null)} onOpenProfile={id => { setGraph(null); onOpenProfile(id); }} />}
    </div>
  );
}
