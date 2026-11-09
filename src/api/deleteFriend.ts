import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Deletes an uploaded Facebook friend entry',
  authenticated: true,
  inputSchema: z.object({ id: z.string() }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input, context }) => {
    const f = await zite.facebookFriends.findOne({ id: input.id });
    if (!f || !([] as string[]).concat(f.owner ?? []).includes(context.user.id))
      throw new ZiteError({ code: 'NOT_FOUND' as any, message: 'Not found', userFacingMessage: 'Entry not found' });
    await zite.facebookFriends.delete({ id: input.id });
    return { success: true };
  },
});
