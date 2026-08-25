import { z } from "zod";

export const createRoomTypeSchema = z
  .object({
    name: z.string().min(2).max(60),
    pricePerMonth: z.number().min(0),
    seatCapacity: z.number().int().min(1),
    hasAC: z.boolean(),
    isAvailable: z.boolean().optional(),
  })
  .strict();
export type CreateRoomTypeInput = z.infer<typeof createRoomTypeSchema>;

export const updateRoomTypeSchema = z
  .object({
    name: z.string().min(2).max(60).optional(),
    pricePerMonth: z.number().min(0).optional(),
    seatCapacity: z.number().int().min(1).optional(),
    hasAC: z.boolean().optional(),
    isAvailable: z.boolean().optional(),
  })
  .strict();
export type UpdateRoomTypeInput = z.infer<typeof updateRoomTypeSchema>;