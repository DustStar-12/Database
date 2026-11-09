import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { normUrl } from '../lib/normUrl';

export default createEndpoint({
  description: 'Imports a list of Facebook friends (name + URL) for a profile',
  authenticated: true,
  inputSchema: z.object({
    profileId: z.string(),
    rows: z.array(z.object({ name: z.string(), url: z.string() })),
  }),
  outputSchema: z.object({ added: z.number(), skipped: z.number() }),
  execute: async ({ input, context }) => {
    const p = await zite.citizenProfiles.findOne({ id: input.profileId });
    if (!p || !([] as string[]).concat(p.owner ?? []).includes(context.user.id))
      throw new ZiteError({ code: 'NOT_FOUND' as any, message: 'Not found', userFacingMessage: 'Profile not found' });
    const existing = new Set<string>();
    let offset = 0;
    for (;;) {
      const r = await zite.facebookFriends.findAll({ filters: { profile: input.profileId }, limit: 2000, offset });
      r.records.forEach(x => x.profileUrl && existing.add(x.profileUrl));
      if (!r.hasMore) break; offset += 2000;
    }
    const toAdd: { name: string; profileUrl: string }[] = [];
    for (const row of input.rows) {
      const url = normUrl(row.url);
      if (!url.includes('facebook.com/') || existing.has(url)) continue;
      existing.add(url);
      toAdd.push({ name: row.name.trim() || url, profileUrl: url });
    }
    for (let i = 0; i < toAdd.length; i += 100) {
      await zite.facebookFriends.bulkCreate({
        records: toAdd.slice(i, i + 100).map(r => ({ ...r, profile: [input.profileId], owner: context.user.id })) as any,
      });
    }
    return { added: toAdd.length, skipped: input.rows.length - toAdd.length };
  },
});
