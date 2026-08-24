import { z } from "zod";
import "dotenv/config";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["dev", "test", "prod"]).default("dev"),
    PORT: z.coerce.number().int().positive().default(3001),
    LOG_LEVEL: z.string().default("info"),
    DATABASE_URL: z.url(),
    JWT_ACCESS_SECRET: z.string().min(32),
    CORS_ORIGINS: z.string().default("http://localhost:5173"),
    UPLOAD_PROVIDER: z.enum(["local", "r2"]).default("local"),
    UPLOAD_LOCAL_DIR: z.string().default("./uploads"),
    RATE_LIMIT: z.coerce.number().int().positive().default(100),

    // Google Sign-In: comma-separated OAuth client IDs; /auth/google is 503 until set.
    GOOGLE_CLIENT_IDS: z.string().optional(),

    CLERK_SECRET_KEY: z.string().optional(),

    // Cloudflare R2 (required when UPLOAD_PROVIDER=r2)
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),
    R2_PUBLIC_BASE_URL: z.url().optional(),
  })
  .superRefine((cfg, ctx) => {
    if (cfg.UPLOAD_PROVIDER === "r2") {
      for (const key of [
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET",
        "R2_PUBLIC_BASE_URL",
      ] as const) {
        if (!cfg[key]) {
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: `${key} is required when UPLOAD_PROVIDER=r2`,
          });
        }
      }
    }
  });

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid env: ", z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const corsOrigins = parsed.data.CORS_ORIGINS.split(",").map((o) =>
  o.trim(),
);
