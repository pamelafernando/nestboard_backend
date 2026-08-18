import type { RequestHandler } from "express";
import * as svc from "../services/booking-service.js";

export const create: RequestHandler = async (req, res, next) => {
  try {
    const booking = await svc.createBookingPending(req.user!.id, req.body);
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

// create and confirm in one request
export const createConfirmed: RequestHandler = async (req, res, next) => {
  try {
    const booking = await svc.createBookingConfirmed(req.user!.id, req.body);
    res.json(booking);
  } catch (err) {
    next(err);
  }
};

export const confirm: RequestHandler = async (req, res, next) => {
  try {
    const booking = await svc.confirmBooking(
      String(req.params.id!),
      req.user!.id,
    );
    res.json(booking);
  } catch (err) {
    next(err);
  }
};

export const myBookings: RequestHandler = async (req, res, next) => {
  try {
    res.json(await svc.listMyBookings(req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const adminBookings: RequestHandler = async (req, res, next) => {
  try {
    res.json(await svc.listAdminBookings(req.user!.id));
  } catch (err) {
    next(err);
  }
};
