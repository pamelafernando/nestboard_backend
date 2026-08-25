import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { Role } from "../generated/enums.js";
import { verifyJwt, requireRole } from "../middleware/auth.js";
import { env } from "../lib/env.js";
import { Errors } from "../lib/errors.js";
import { uploadToR2 } from "../lib/storage.js";

export const uploadsRouter = Router();

const useR2 = env.UPLOAD_PROVIDER === "r2";

if (!useR2) {
  fs.mkdirSync(env.UPLOAD_LOCAL_DIR, { recursive: true });
}

// R2 uploads stream from memory (5 MB cap); local keeps writing to disk.
const storage = useR2
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, env.UPLOAD_LOCAL_DIR),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${randomUUID()}${ext}`);
      },
    });

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok: boolean = ["image/jpeg", "image/png", "image/webp"].includes(
      file.mimetype,
    );
    cb(
      ok
        ? null
        : (Errors.validation("Only JPG/PNG/WEBP images are allowed") as any),
      ok,
    );
  },
});

uploadsRouter.post(
  "/cover-image",
  verifyJwt,
  requireRole(Role.ADMIN),
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw Errors.validation("Missing image field");
      }
      if (useR2) {
        const ext = path.extname(req.file.originalname).toLowerCase();
        const key = `cover-images/${randomUUID()}${ext}`;
        const url = await uploadToR2(key, req.file.buffer, req.file.mimetype);
        res.status(201).json({ url });
        return;
      }
      res.status(201).json({ url: `/uploads/${req.file.filename}` });
    } catch (err) {
      next(err);
    }
  },
);

uploadsRouter.post(
  "/avatar",
  verifyJwt,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw Errors.validation("Missing image field");
      }
      if (useR2) {
        const ext = path.extname(req.file.originalname).toLowerCase();
        const key = `avatars/${randomUUID()}${ext}`;
        const url = await uploadToR2(key, req.file.buffer, req.file.mimetype);
        res.status(201).json({ url });
        return;
      }
      res.status(201).json({ url: `/uploads/${req.file.filename}` });
    } catch (err) {
      next(err);
    }
  },
);