import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { validateBody } from "../middleware/validate.js";
import { createReviewSchema } from "../schemas/review.js";
import { Errors } from "../lib/errors.js";
import { verifyJwt, requireRole } from "../middleware/auth.js";
import { Role } from "../generated/enums.js";

export const reviewsRouter = Router();

reviewsRouter.post(
  "/",
  verifyJwt,
  requireRole(Role.USER),
  validateBody(createReviewSchema),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw Errors.unauthenticated();
      const { propertyId, bookingId, rating, comment } = req.body;

      // Eligibility: the booking must belong to this tenant, be for this
      // property (traced through room -> roomType -> property), and be
      // confirmed - a pending or cancelled stay doesn't qualify.
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { room: { include: { roomType: true } } },
      });
      if (!booking) throw Errors.notFound("Booking");
      if (booking.tenantId !== userId) throw Errors.forbidden();
      if (booking.room.roomType.propertyId !== propertyId) {
        throw Errors.validation("Booking does not match this property");
      }
      if (booking.bookingStatus !== "CONFIRMED") {
        throw Errors.conflict("Only confirmed stays can be reviewed");
      }

      // One review per user per property - upsert replaces a prior review
      // rather than rejecting the attempt (see project notes for reasoning).
      const review = await prisma.review.upsert({
        where: { userId_propertyId: { userId, propertyId } },
        create: { userId, propertyId, bookingId, rating, comment },
        update: { rating, comment, bookingId },
      });

      // Recompute the property's average rating from all its reviews.
      const agg = await prisma.review.aggregate({
        where: { propertyId },
        _avg: { rating: true },
      });
      await prisma.property.update({
        where: { id: propertyId },
        data: { rating: agg._avg.rating ?? 0 },
      });

      res.status(201).json(review);
    } catch (err) {
      next(err);
    }
  },
);

reviewsRouter.get("/property/:propertyId", async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { propertyId: String(req.params.propertyId) },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { displayName: true } } },
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});