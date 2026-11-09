import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Car, Dna, User, Phone, MapPin, Globe, ScanFace, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import { deleteProfile } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@project/components/ui/alert-dialog';
import type { Profile } from '../App';
import { SECTIONS, calcAge, profileCode } from '../lib/fields';
import { MapView } from './MapPicker';
import { parseJson, Extra } from './Footprint';

const sec = (t: string) => SECTIONS.find(s => s.title === t)!;

function fmt(key: string, v: unknown) {
  if (v === undefined || v === null || v === '') return null;
  if (key === 'dateOfBirth') return new Date(String(v)).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  if (key === 'heightCm') return `${v} cm`;
  if (key === 'weightKg') return `${v} kg`;
  return String(v);
}

function Panel({ title, icon: Icon, children, delay = 0, className = '' }: { title: string; icon: any; children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className={`holo-panel ${className}`}>
      <h3 className="font-display text-xs text-primary glow-text flex items-center gap-2 bg-primary/10 border-b border-primary/40 px-3 py-1.5">
        <Icon className="h-4 w-4" />{title.toUpperCase()}
      </h3>
      {children}
    </motion.section>
  );
}

function Thumb({ url }: { url?: string }) {
  return url ? <a href={url} target="_blank" rel="noreferrer" className="inline-block h-8 w-8 border border-primary/50 overflow-hidden ml-2 align-middle shrink-0"><img src={url} className="h-full w-full object-cover" /></a> : null;
}

function Table({ profile, title, skip = [] }: { profile: Profile; title: string; skip?: string[] }) {
  const imgs = title === 'Digital Footprint' ? parseJson<Record<string, string>>(profile.footprintImages, {}) : {};
  const extras = title === 'Digital Footprint' ? parseJson<Extra[]>(profile.additionalSocials, []) : [];
  return (
    <table className="w-full text-[13px] leading-tight">
      <tbody>
        {sec(title).fields.filter(f => !skip.includes(f.key)).map(f => {
          const v = fmt(f.key, (profile as any)[f.key]);
          return (
            <tr key={f.key} className="border-b border-border/30 last:border-0">
              <th className="text-left align-top font-semibold text-[11px] uppercase tracking-wider text-accent px-3 py-1 w-[45%]">{f.label}</th>
              <td className="px-3 py-1 break-all whitespace-pre-line"><div className="flex items-center justify-between gap-1">{v ?? <span className="text-muted-foreground font-mono text-xs">—</span>}<Thumb url={imgs[f.key]} /></div></td>
            </tr>
          );
        })}
        {extras.map((x, i) => (
          <tr key={'x' + i} className="border-b border-border/30 last:border-0">
            <th className="text-left align-top font-semibold text-[11px] uppercase tracking-wider text-accent px-3 py-1 w-[45%]">{x.platform}</th>
            <td className="px-3 py-1 break-all"><div className="flex items-center justify-between gap-1">{x.value || '—'}<Thumb url={x.imageUrl} /></div></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ProfileDossier({ profile, onEdit, onDeleted, onClose, onFriends }: { profile: Profile; onEdit: () => void; onDeleted: () => void; onClose: () => void; onFriends: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const age = calcAge(profile.dateOfBirth);
  const remove = async () => {
    try { await deleteProfile({ id: profile.id }); toast.success('Profile deleted'); onDeleted(); }
    catch { toast.error('Delete failed'); }
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('[role=dialog],[role=alertdialog],[data-friends]')) onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm p-3 md:p-4 overflow-y-auto lg:overflow-hidden">
    <Button variant="outline" size="icon" onClick={onClose} className="absolute top-3 right-3 z-10" title="Close (Esc)"><X className="h-4 w-4" /></Button>
    <div key={profile.id} className="grid lg:grid-cols-[1fr_1.1fr_1fr] gap-3 lg:h-full max-w-[1800px] mx-auto">
      <div className="space-y-3 order-2 lg:order-1 lg:overflow-y-auto">
        <Panel title="Personal Identity" icon={User} delay={0.05}>
          <Table profile={profile} title="Personal Identity" skip={['fullName']} />
          <div className="flex border-t border-border/30 px-3 py-2 text-sm"><span className="w-[45%] text-[11px] uppercase tracking-wider text-accent font-semibold">Age</span>{age ?? '—'}</div>
        </Panel>
        <Panel title="Vehicle Registered" icon={Car} delay={0.1}><Table profile={profile} title="Vehicle Registered" /></Panel>
      </div>

      <div className="flex flex-col gap-3 order-1 lg:order-2 lg:min-h-0">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="holo-panel p-3 flex flex-col lg:flex-1 lg:min-h-0">
          <div className="text-center mb-2">
            <p className="font-display text-[11px] text-muted-foreground">CITIZEN PROFILE</p>
            <h2 className="font-display text-lg md:text-xl font-bold text-accent">{profile.fullName || 'Unnamed'}</h2>
            <p className="font-mono text-xs">ID: <span className="text-primary">{profileCode(profile.id)}</span> · STATUS: <span className="text-accent">ACTIVE</span></p>
          </div>
          <div className="relative mx-auto aspect-[4/5] h-[45vh] lg:h-auto lg:flex-1 lg:min-h-0 border-2 border-primary/70 shadow-[0_0_30px_hsl(var(--primary)/0.35)] overflow-hidden bg-background/60">
            {profile.photoUrl ? <img src={profile.photoUrl} alt={profile.fullName} className="h-full w-full object-cover" />
              : <div className="h-full grid place-items-center"><ScanFace className="h-24 w-24 text-primary/40" /></div>}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,hsl(var(--primary)/0.06)_50%)] bg-[length:100%_4px]" />
          </div>
          <div className="flex justify-center gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={onEdit}><Pencil className="h-4 w-4 mr-1" />Edit</Button>
            <Button variant="outline" size="sm" onClick={onFriends}><Users className="h-4 w-4 mr-1" />Friends</Button>
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
          </div>
        </motion.div>
        <Panel title="Residency / Location" icon={MapPin} delay={0.15}>
          <div className="p-3 space-y-2">
            <p className="text-sm whitespace-pre-line">{profile.address || <span className="text-muted-foreground font-mono text-xs">— NO ADDRESS —</span>}</p>
            {profile.latitude != null && <>
              <MapView lat={profile.latitude} lng={profile.longitude} className="h-32 border border-primary/40" />
              <p className="font-mono text-[11px] text-muted-foreground">{profile.latitude.toFixed(5)}°, {profile.longitude?.toFixed(5)}°</p>
            </>}
          </div>
        </Panel>
      </div>

      <div className="space-y-3 order-3 lg:overflow-y-auto">
        <Panel title="Biometrics & Physical" icon={Dna} delay={0.1}><Table profile={profile} title="Biometrics & Physical" /></Panel>
        <Panel title="Communications" icon={Phone} delay={0.15}><Table profile={profile} title="Contact Information" /></Panel>
        <Panel title="Digital Footprint" icon={Globe} delay={0.2}><Table profile={profile} title="Digital Footprint" /></Panel>
      </div>

    </div>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this profile?</AlertDialogTitle>
            <AlertDialogDescription>{profile.fullName}'s record will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
