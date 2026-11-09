import * as XLSX from 'xlsx';

export type FriendRow = { name: string; url: string };

export async function parseFriendsSheet(file: File): Promise<FriendRow[]> {
  const wb = XLSX.read(await file.arrayBuffer());
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]);
  const nameKey = keys.find(k => /name/i.test(k)) ?? keys[0];
  const urlKey = keys.find(k => /url|link|profile/i.test(k) && k !== nameKey) ?? keys[1];
  if (!urlKey) throw new Error('The sheet needs a Name column and a URL column');
  return rows
    .map(r => ({ name: String(r[nameKey] ?? '').trim(), url: String(r[urlKey] ?? '').trim() }))
    .filter(r => /facebook\.com\/|fb\.com\//i.test(r.url));
}
