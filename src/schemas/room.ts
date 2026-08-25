import { z } from "zod";

export const createRoomInputSchema = z
  .object({
    roomLabel: z.string().min(1).max(60),
    isAvailable: z.boolean().optional(),
  })
  .strict();
export type CreateRoomInputType = z.infer<typeof createRoomInputSchema>;

export const updateRoomSchema = z
  .object({
    roomLabel: z.string().min(1).max(60).optional(),
    isAvailable: z.boolean().optional(),
  })
  .strict();
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;