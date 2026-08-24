import { Prisma, type PrismaClient } from "../generated/client.js";
import { BookingStatus, PaymentStatus } from "../generated/enums.js";
import { prisma as defaultPrisma } from "../lib/prisma.js";
import { Errors } from "../lib/errors.js";
import type { CreateBookingInput } from "../schemas/booking.js";
import { leaseRange, TEN_MIN_MS } from "./availability.js";

async function createBooking(
  tenantId: string,
  input: CreateBookingInput,
  statuses: { bookingStatus: BookingStatus; paymentStatus: PaymentStatus },
  db: PrismaClient,
) {
  const { start, end } = leaseRange(input.startMonth, input.durationMonths);

  return db.$transaction(
    async (tx) => {
      const room = await tx.room.findUnique({
        where: { id: input.roomId },
        include: { roomType: true },
      });
      if (!room) throw Errors.notFound("Room");
      if (!room.isAvailable || !room.roomType.isAvailable) {
        throw Errors.conflict("Room is not available");
      }
      if (input.seatNumber > room.roomType.seatCapacity) {
        throw Errors.validation(
          `Seat ${input.seatNumber} exceeds capacity ${room.roomType.seatCapacity}`,
        );
      }

      const conflict = await tx.booking.findFirst({
        where: {
          roomId: input.roomId,
          seatNumber: input.seatNumber,
          bookingStatus: {
            in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
          },
          leaseStart: { lt: end },
          leaseEnd: { gt: start },
        },
        select: { id: true, bookingStatus: true, createdAt: true },
      });

      if (conflict) {
        const isStale =
          conflict.bookingStatus === BookingStatus.PENDING &&
          Date.now() - conflict.createdAt.getTime() > TEN_MIN_MS;
        if (isStale) {
          await tx.booking.update({
            where: { id: conflict.id },
            data: {
              bookingStatus: BookingStatus.EXPIRED,
              paymentStatus: PaymentStatus.FAILED,
            },
          });
        } else {
          throw Errors.conflict("Seat unavailable for this period");
        }
      }

      const totalAmount = room.roomType.pricePerMonth.mul(
        input.durationMonths,
      );

      return tx.booking.create({
        data: {
          tenantId,
          roomId: input.roomId,
          seatNumber: input.seatNumber,
          leaseStart: start,
          leaseEnd: end,
          durationMonths: input.durationMonths,
          totalAmount,
          paymentStatus: statuses.paymentStatus,
          bookingStatus: statuses.bookingStatus,
        },
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10000,
      timeout: 10000,
    },
  );
}

export async function createBookingPending(
  tenantId: string,
  input: CreateBookingInput,
  db: PrismaClient = defaultPrisma,
) {
  return createBooking(
    tenantId,
    input,
    {
      bookingStatus: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    },
    db,
  );
}

// books and confirms in a single transaction
export async function createBookingConfirmed(
  tenantId: string,
  input: CreateBookingInput,
  db: PrismaClient = defaultPrisma,
) {
  return createBooking(
    tenantId,
    input,
    {
      bookingStatus: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
    },
    db,
  );
}

export async function confirmBooking(
  bookingId: string,
  tenantId: string,
  db: PrismaClient = defaultPrisma,
) {
  return db.$transaction(
    async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking) throw Errors.notFound("Booking");
      if (booking.tenantId !== tenantId) throw Errors.forbidden();
      if (booking.bookingStatus !== BookingStatus.PENDING) {
        throw Errors.conflict(`Booking is already ${booking.bookingStatus}`);
      }
      if (Date.now() - booking.createdAt.getTime() > TEN_MIN_MS) {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            bookingStatus: BookingStatus.EXPIRED,
            paymentStatus: PaymentStatus.FAILED,
          },
        });
        throw Errors.conflict("Booking expired before payment");
      }
      return tx.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          bookingStatus: BookingStatus.CONFIRMED,
        },
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10000,
      timeout: 10000,
    },
  );
}

export async function listMyBookings(
  tenantId: string,
  db: PrismaClient = defaultPrisma,
) {
  return db.booking.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      room: { include: { roomType: { include: { property: true } } } },
    },
  });
}

// Bookings made against properties owned by this vendor/admin.
// Ownership runs Booking -> Room -> RoomType -> Property -> vendorId,
// enforced entirely server-side.
export async function listAdminBookings(
  vendorId: string,
  db: PrismaClient = defaultPrisma,
) {
  return db.booking.findMany({
    where: {
      room: {
        roomType: {
          property: { vendorId },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      tenant: { select: { id: true, displayName: true, email: true } },
      room: { include: { roomType: { include: { property: true } } } },
    },
  });
}