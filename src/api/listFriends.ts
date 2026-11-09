import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Lists all Facebook friends uploaded by the signed-in user',
  authenticated: true,
  inputSchema: z.object({}),
  outputSchema: z.object({
    friends: z.array(z.object({ id: z.string(), name: z.string(), url: z.string(), profileId: z.string() })),
  }),
  execute: async ({ context }) => {
    const out: { id: string; name: string; url: string; profileId: string }[] = [];
    let offset = 0;
    for (;;) {
      const r = await zite.facebookFriends.findAll({ filters: { owner: context.user.id }, limit: 2000, offset });
      for (const x of r.records) {
        const pid = ([] as string[]).concat(x.profile ?? [])[0];
        if (pid && x.profileUrl) out.push({ id: x.id, name: x.name ?? '', url: x.profileUrl, profileId: pid });
      }
      if (!r.hasMore) break; offset += 2000;
    }
    return { friends: out };
  },
});
