// src/schemas/review.ts
import { z } from "zod";

export const createReviewSchema = z
  .object({
    propertyId: z.uuid(),
    bookingId: z.uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  })
  .strict();
export type CreateReviewInput = z.infer<typeof createReviewSchema>;