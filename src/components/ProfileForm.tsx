import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Camera, X } from 'lucide-react';
import { saveProfile, importFriends } from 'zitejs/api';
import { parseFriendsSheet, FriendRow } from '../lib/friends';
import { FileSpreadsheet } from 'lucide-react';
import { useUpload } from 'zitejs/upload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@project/components/ui/dialog';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Textarea } from '@project/components/ui/textarea';
import { Label } from '@project/components/ui/label';
import { DatePicker } from '@project/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import type { Profile } from '../App';
import { SECTIONS, FieldDef, VEHICLES, YEARS } from '../lib/fields';
import MapPicker from './MapPicker';
import { ExtraSocials, ImageSlot, Extra, parseJson, validateExtras } from './Footprint';

type Vals = Record<string, string>;
const ALL = SECTIONS.flatMap(s => s.fields);
const NUM = new Set(['heightCm', 'weightKg', 'modelYear']);

export default function ProfileForm({ open, profile, onClose, onSaved }: { open: boolean; profile: Profile | null; onClose: () => void; onSaved: (id: string) => void }) {
  const [vals, setVals] = useState<Vals>({});
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [photo, setPhoto] = useState<string | null>(null);
  const [fpImages, setFpImages] = useState<Record<string, string>>({});
  const [extras, setExtras] = useState<Extra[]>([]);
  const [pending, setPending] = useState<{ file: string; rows: FriendRow[] } | null>(null);
  const [errors, setErrors] = useState<Vals>({});
  const [saving, setSaving] = useState(false);
  const { upload, isUploading } = useUpload();

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setVals(Object.fromEntries(ALL.map(f => [f.key, profile ? String((profile as any)[f.key] ?? '') : ''])));
    setCoords({ lat: profile?.latitude ?? null, lng: profile?.longitude ?? null });
    setPhoto(profile?.photoUrl ?? null);
    setFpImages(parseJson(profile?.footprintImages, {}));
    setExtras(parseJson(profile?.additionalSocials, []));
    setPending(null);
  }, [open, profile]);

  const validate = () => {
    const e: Vals = {};
    for (const f of ALL) if (f.pattern && vals[f.key]?.trim() && !f.pattern.test(vals[f.key].trim())) e[f.key] = f.hint ?? 'Invalid format';
    for (const k of ['heightCm', 'weightKg']) if (vals[k] && (isNaN(+vals[k]) || +vals[k] <= 0)) e[k] = 'Must be a positive number';
    const ex = validateExtras(extras); if (ex) e._extras = ex;
    setErrors(e);
    if (Object.keys(e).length) toast.error('Please fix the highlighted fields');
    return !Object.keys(e).length;
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    try { setPhoto((await upload(file)).url); } catch { toast.error('Photo upload failed'); }
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const cleanExtras = extras.filter(x => x.platform.trim() || x.value.trim());
      const data: any = { additionalSocials: cleanExtras.length ? JSON.stringify(cleanExtras) : null, footprintImages: Object.keys(fpImages).length ? JSON.stringify(fpImages) : null, photoUrl: photo, latitude: coords.lat, longitude: coords.lng };
      for (const f of ALL) { const v = vals[f.key]?.trim(); data[f.key] = !v ? null : NUM.has(f.key) ? Number(v) : v; }
      const { id } = await saveProfile({ id: profile?.id, data });
      if (pending?.rows.length) {
        const r = await importFriends({ profileId: id, rows: pending.rows });
        toast.success(`Friends imported: ${r.added} added, ${r.skipped} skipped (duplicates)`);
      }
      toast.success(profile ? 'Profile updated' : 'Profile created');
      onSaved(id);
    } catch { toast.error('Save failed'); } finally { setSaving(false); }
  };

  const set = (k: string, v: string) => setVals(s => ({ ...s, [k]: v, ...(k === 'vehicleMake' ? { vehicleModel: '' } : {}) }));

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-primary/50">
        <DialogHeader><DialogTitle className="font-display text-primary glow-text">{profile ? 'EDIT PROFILE' : 'NEW PROFILE'}</DialogTitle></DialogHeader>
        <div className="flex items-center gap-4">
          <div className="h-28 w-24 border border-primary/50 bg-background/60 grid place-items-center overflow-hidden relative">
            {photo ? <img src={photo} className="h-full w-full object-cover" /> : <Camera className="h-6 w-6 text-muted-foreground" />}
            {photo && <button type="button" onClick={() => setPhoto(null)} className="absolute top-1 right-1 bg-background/80 p-0.5"><X className="h-3 w-3" /></button>}
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={e => onFile(e.target.files?.[0])} />
            <span className="inline-flex items-center border border-primary/50 px-3 py-2 text-sm hover:bg-primary/10">
              {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}{photo ? 'Change photo' : 'Upload photo'}
            </span>
          </label>
        </div>
        <div className="space-y-6">
          {SECTIONS.map(sec => (
            <section key={sec.title}>
              <h4 className="font-display text-xs text-accent mb-3 border-b border-border/50 pb-1">{sec.title.toUpperCase()}</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                {sec.fields.map(f => f.type === 'address'
                  ? <div key={f.key} className="sm:col-span-2"><MapPicker address={vals.address ?? ''} lat={coords.lat} lng={coords.lng}
                      onChange={v => { setCoords({ lat: v.lat, lng: v.lng }); if (v.address !== undefined) set('address', v.address); }} /></div>
                  : sec.title === 'Digital Footprint'
                    ? <div key={f.key} className="space-y-1"><Field f={f} vals={vals} error={errors[f.key]} onChange={v => set(f.key, v)} />
                        <ImageSlot url={fpImages[f.key]} onChange={u => setFpImages(s => { const n = { ...s }; if (u) n[f.key] = u; else delete n[f.key]; return n; })} />
                        {f.key === 'facebookProfileUrl' && <FriendsUpload pending={pending} setPending={setPending} />}</div>
                    : <Field key={f.key} f={f} vals={vals} error={errors[f.key]} onChange={v => set(f.key, v)} />)}
                {sec.title === 'Digital Footprint' && <><ExtraSocials items={extras} onChange={setExtras} />
                  {errors._extras && <p className="sm:col-span-2 text-xs text-destructive">{errors._extras}</p>}</>}
              </div>
            </section>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving || isUploading}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Pick({ value, options, onChange, placeholder = 'Select…', disabled }: { value: string; options: string[]; onChange: (v: string) => void; placeholder?: string; disabled?: boolean }) {
  const opts = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent className="max-h-72">{opts.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function Field({ f, vals, error, onChange }: { f: FieldDef; vals: Vals; error?: string; onChange: (v: string) => void }) {
  const value = vals[f.key] ?? '';
  let control;
  if (f.type === 'textarea') control = <Textarea value={value} onChange={e => onChange(e.target.value)} rows={2} />;
  else if (f.type === 'select') control = <Pick value={value} options={f.options!} onChange={onChange} />;
  else if (f.type === 'model') control = <Pick value={value} options={VEHICLES[vals.vehicleMake] ?? []} onChange={onChange} disabled={!vals.vehicleMake} placeholder={vals.vehicleMake ? 'Select…' : 'Choose a make first'} />;
  else if (f.type === 'year') control = <Pick value={value} options={YEARS} onChange={onChange} />;
  else if (f.type === 'date') control = <DatePicker value={value ? new Date(value + 'T00:00:00') : undefined}
    onChange={d => onChange(d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '')} />;
  else control = <Input value={value} placeholder={f.placeholder} inputMode={f.type === 'number' ? 'decimal' : undefined}
    onChange={e => onChange(f.upper ? e.target.value.toUpperCase() : e.target.value)} className={error ? 'border-destructive' : ''} />;
  return (
    <div className={f.type === 'textarea' ? 'sm:col-span-2 space-y-1' : 'space-y-1'}>
      <Label className="text-xs uppercase tracking-wider">{f.label}</Label>
      {control}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FriendsUpload({ pending, setPending }: { pending: { file: string; rows: FriendRow[] } | null; setPending: (v: { file: string; rows: FriendRow[] } | null) => void }) {
  const onFile = async (f?: File) => {
    if (!f) return;
    try {
      const rows = await parseFriendsSheet(f);
      if (!rows.length) return toast.error('No Facebook URLs found. Use columns: Name, URL');
      setPending({ file: f.name, rows });
    } catch (e: any) { toast.error(e?.message ?? 'Could not read the file'); }
  };
  return (
    <div className="border border-dashed border-primary/40 p-2 mt-1 text-[11px] space-y-1">
      <label className="cursor-pointer inline-flex items-center gap-1 text-primary hover:underline">
        <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
        <FileSpreadsheet className="h-3 w-3" />Upload friends list (Excel: Name / URL)
      </label>
      {pending && <div className="flex items-center justify-between text-muted-foreground"><span>{pending.file}: {pending.rows.length} friends will be imported on save</span>
        <button type="button" onClick={() => setPending(null)} className="text-destructive">remove</button></div>}
    </div>
  );
}
