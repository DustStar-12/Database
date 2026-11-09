import { Camera, Loader2, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUpload } from 'zitejs/upload';
import { Input } from '@project/components/ui/input';
import { Button } from '@project/components/ui/button';

export type Extra = { platform: string; value: string; imageUrl?: string };

export function parseJson<T>(s: string | null | undefined, fallback: T): T {
  try { return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}

export function ImageSlot({ url, onChange }: { url?: string; onChange: (url?: string) => void }) {
  const { upload, isUploading } = useUpload();
  const pick = async (f?: File) => {
    if (!f) return;
    try { onChange((await upload(f)).url); } catch { toast.error('Upload failed'); }
  };
  return (
    <div className="flex items-center gap-2">
      {url && (
        <div className="relative h-9 w-9 border border-primary/50 overflow-hidden shrink-0">
          <a href={url} target="_blank" rel="noreferrer"><img src={url} className="h-full w-full object-cover" /></a>
          <button type="button" onClick={() => onChange(undefined)} className="absolute top-0 right-0 bg-background/80"><X className="h-3 w-3" /></button>
        </div>
      )}
      <label className="cursor-pointer text-[11px] inline-flex items-center gap-1 text-primary hover:underline">
        <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={e => pick(e.target.files?.[0])} />
        {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}{url ? 'Replace image' : 'Add image'}
      </label>
    </div>
  );
}

export function ExtraSocials({ items, onChange }: { items: Extra[]; onChange: (v: Extra[]) => void }) {
  const upd = (i: number, patch: Partial<Extra>) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div className="sm:col-span-2 space-y-2">
      {items.map((x, i) => (
        <div key={i} className="border border-border/50 p-2 space-y-2">
          <div className="flex gap-2">
            <Input value={x.platform} onChange={e => upd(i, { platform: e.target.value })} placeholder="Platform (e.g. Snapchat, Website)" className="w-2/5" />
            <Input value={x.value} onChange={e => upd(i, { value: e.target.value })} placeholder="Handle or link" />
            <Button type="button" variant="ghost" size="icon" onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
          </div>
          <ImageSlot url={x.imageUrl} onChange={u => upd(i, { imageUrl: u })} />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, { platform: '', value: '' }])}>
        <Plus className="h-4 w-4 mr-1" />Add another platform
      </Button>
    </div>
  );
}

export function validateExtras(items: Extra[]) {
  for (const x of items) {
    if (!x.platform.trim() && !x.value.trim()) continue;
    if (!x.platform.trim()) return 'Each additional entry needs a platform name';
    const v = x.value.trim();
    if (v && !/^(@?[A-Za-z0-9._-]{1,50}|https?:\/\/[^\s]+\.[^\s]+)$/.test(v)) return `"${v}" must be a handle or a full http(s) link`;
  }
  return null;
}
