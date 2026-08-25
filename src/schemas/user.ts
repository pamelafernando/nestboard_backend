import { z } from "zod";

export const updateProfileSchema = z
  .object({
    displayName: z.string().min(1).max(60).optional(),
    avatarUrl: z.url().optional(),
  })
  .strict();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;