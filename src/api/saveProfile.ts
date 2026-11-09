import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';

const s = z.string().nullable().optional();
const n = z.number().nullable().optional();

export default createEndpoint({
  description: 'Creates or updates a profile owned by the signed-in user',
  authenticated: true,
  inputSchema: z.object({
    id: z.string().optional(),
    data: z.object({
      fullName: z.string().nullable().optional(), motherSName: s, dateOfBirth: s, gender: s, nationality: s,
      heightCm: n, weightKg: n, eyeColor: s, hairColor: s, distinguishingMarks: s,
      phoneNumber: s, emailAddress: s, address: s, facebookProfileUrl: s, instagramHandle: s,
      xHandle: s, linkedInProfileUrl: s, tikTokUsername: s, youTubeChannel: s,
      vehicleMake: s, vehicleModel: s, modelYear: n, vehicleColor: s, licensePlateNumber: s,
      registeredOwnerName: s, photoUrl: s, fbid: s, additionalSocials: s, footprintImages: s, latitude: n, longitude: n,
    }),
  }),
  outputSchema: z.object({ id: z.string() }),
  execute: async ({ input, context }) => {
    const { photoUrl, ...rest } = input.data;
    const record: any = { ...rest, photo: photoUrl ? [{ url: photoUrl }] : null };
    if (input.id) {
      const existing = await zite.citizenProfiles.findOne({ id: input.id });
      const owners = ([] as string[]).concat(existing?.owner ?? []);
      if (!owners.includes(context.user.id)) throw new ZiteError({ code: 'NOT_FOUND' as any, message: 'Not found', userFacingMessage: 'Profile not found' });
      await zite.citizenProfiles.update({ id: input.id, record });
      return { id: input.id };
    }
    const created = await zite.citizenProfiles.create({ record: { ...record, owner: context.user.id } });
    return { id: created.id };
  },
});
