import { useEffect, useMemo, useState } from 'react';
import { useAuth } from 'zitejs/auth';
import { listProfiles, ListProfilesOutputType } from 'zitejs/api';
import { Toaster } from '@project/components/ui/sonner';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Skeleton } from '@project/components/ui/skeleton';
import { Plus, Search, ScanFace, Users,  } from 'lucide-react';
import { toast } from 'sonner';
import ProfileList from './components/ProfileList';
import ProfileDossier from './components/ProfileDossier';
import ProfileForm from './components/ProfileForm';
import FriendsView from './components/FriendsView';

export type Profile = ListProfilesOutputType['profiles'][0];

export default function App() {
  const { user, isLoading } = useAuth();
  useEffect(() => { document.documentElement.classList.add('dark'); }, []);
  if (isLoading || !user) return <div className="min-h-screen grid place-items-center font-display text-primary glow-text animate-pulse">AUTHENTICATING…</div>;
  return <><Main /><Toaster /></>;
}

function Main() {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Profile | 'new' | null>(null);
  const [q, setQ] = useState('');
  const [friendsFor, setFriendsFor] = useState<string | null | undefined>(undefined);

  const load = async (selectId?: string) => {
    try {
      const { profiles } = await listProfiles({});
      const sorted = [...profiles].sort((a, b) => (a.fullName ?? '').localeCompare(b.fullName ?? ''));
      setProfiles(sorted);
      setSelectedId(cur => selectId ?? (sorted.some(p => p.id === cur) ? cur : null));
    } catch { toast.error('Failed to load profiles'); setProfiles([]); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return (profiles ?? []).filter(p => !t || Object.values(p).some(v => String(v ?? '').toLowerCase().includes(t)));
  }, [profiles, q]);
  const selected = profiles?.find(p => p.id === selectedId) ?? null;

  return (
    <div className="min-h-screen p-3 md:p-4 max-w-[1800px] mx-auto">
      <header className="holo-panel px-4 py-2 mb-4 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <ScanFace className="h-7 w-7 text-primary" />
          <div>
            <h1 className="font-display text-lg md:text-xl font-bold text-primary glow-text">CITIZEN PROFILE DATABASE</h1>
            <p className="font-mono text-[11px] text-muted-foreground">RECORDS ONLINE: {profiles?.length ?? '—'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFriendsFor(null)} className="font-display text-xs"><Users className="h-4 w-4 mr-1" />FRIENDS</Button>
          <Button onClick={() => setEditing('new')} className="font-display text-xs"><Plus className="h-4 w-4 mr-1" />NEW PROFILE</Button>
        </div>
      </header>
      <div>
        <aside className={`holo-panel p-2 h-fit max-w-3xl w-full mx-auto`}>
          <div className="relative mb-2">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search any field…" className="pl-9 font-mono text-xs bg-background/60" />
          </div>
          {profiles === null ? <div className="space-y-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-14" />)}</div>
            : profiles.length === 0 ? <div className="text-center py-10"><Button onClick={() => setEditing('new')}><Plus className="h-4 w-4 mr-1" />Create the first profile</Button></div>
            : <ProfileList profiles={filtered} selectedId={selectedId} onSelect={id => setSelectedId(cur => cur === id ? null : id)} />}
        </aside>
        {selected && <ProfileDossier onFriends={() => setFriendsFor(selected.id)} onClose={() => setSelectedId(null)} profile={selected} onEdit={() => setEditing(selected)} onDeleted={() => { setSelectedId(null); load(); }} />}
      </div>
      {friendsFor !== undefined && profiles && <FriendsView profiles={profiles} focusId={friendsFor} onClose={() => setFriendsFor(undefined)}
        onOpenProfile={id => { setFriendsFor(undefined); setSelectedId(id); }} />}
      <ProfileForm open={editing !== null} profile={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={id => { setEditing(null); load(id); }} />
    </div>
  );
}
