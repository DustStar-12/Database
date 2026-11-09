export function normUrl(u: string) {
  let s = u.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^(www|m|web|mbasic)\./, '');
  const idMatch = s.match(/profile\.php\?id=(\d+)/);
  if (idMatch) return `facebook.com/profile.php?id=${idMatch[1]}`;
  s = s.split(/[?#]/)[0].replace(/\/+$/, '');
  return s.replace(/^fb\.com/, 'facebook.com');
}
