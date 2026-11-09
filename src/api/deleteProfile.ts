import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Deletes a profile owned by the signed-in user',
  authenticated: true,
  inputSchema: z.object({ id: z.string() }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input, context }) => {
    const existing = await zite.citizenProfiles.findOne({ id: input.id });
    const owners = ([] as string[]).concat(existing?.owner ?? []);
    if (!owners.includes(context.user.id)) throw new ZiteError({ code: 'NOT_FOUND' as any, message: 'Not found', userFacingMessage: 'Profile not found' });
    await zite.citizenProfiles.delete({ id: input.id });
    return { success: true };
  },
});
