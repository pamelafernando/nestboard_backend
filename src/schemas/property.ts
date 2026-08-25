import { z } from "zod";

export const createPropertySchema = z
  .object({
    title: z.string().min(3).max(120),
    description: z.string().min(3).max(2000),
    address: z.string().min(3).max(120),
    city: z.string().min(3).max(120),
    type: z.enum(["HOUSE", "VILLA", "APARTMENT", "HOTEL"]),
    rating: z.number().min(0).max(5),
    latitude: z.float32(),
    longitude: z.float32(),
    imageUrl: z.url(),
    amenities: z.array(z.string()).optional(),
    minStay: z.string().optional(),
  })
  .strict();
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

// Partial update - every field optional, since PATCH only sends what changed.
// vendorId, id, createdAt are never client-editable.
export const updatePropertySchema = z
  .object({
    title: z.string().min(3).max(120).optional(),
    description: z.string().min(3).max(2000).optional(),
    address: z.string().min(3).max(120).optional(),
    city: z.string().min(3).max(120).optional(),
    type: z.enum(["HOUSE", "VILLA", "APARTMENT", "HOTEL"]).optional(),
    rating: z.number().min(0).max(5).optional(),
    latitude: z.float32().optional(),
    longitude: z.float32().optional(),
    imageUrl: z.url().optional(),
    amenities: z.array(z.string()).optional(),
    minStay: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;