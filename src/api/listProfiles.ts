import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

const s = z.string().optional();
const n = z.number().optional();

export default createEndpoint({
  description: 'Lists the profiles owned by the signed-in user',
  authenticated: true,
  inputSchema: z.object({}),
  outputSchema: z.object({
    profiles: z.array(z.object({
      id: z.string(), fullName: s, motherSName: s, dateOfBirth: s, gender: s, nationality: s,
      heightCm: n, weightKg: n, eyeColor: s, hairColor: s, distinguishingMarks: s,
      phoneNumber: s, emailAddress: s, address: s, facebookProfileUrl: s, instagramHandle: s,
      xHandle: s, linkedInProfileUrl: s, tikTokUsername: s, youTubeChannel: s,
      vehicleMake: s, vehicleModel: s, modelYear: n, vehicleColor: s, licensePlateNumber: s,
      registeredOwnerName: s, photoUrl: s, fbid: s, additionalSocials: s, footprintImages: s, latitude: n, longitude: n,
    })),
  }),
  execute: async ({ context }) => {
    const { records } = await zite.citizenProfiles.findAll({
      filters: { owner: context.user.id }, limit: 2000,
    });
    return { profiles: records.map(({ owner, photo, ...r }) => ({ ...r, photoUrl: photo?.[0]?.url }) as any) };
  },
});
