import express from "express";
import * as bookingController from "../controllers/availability";
const router = express.Router();

router.get("/", (req, res) => {
  bookingController.getAvailability(req, res);
});

router.get("/slots", (req, res) => {
  bookingController.getAvailableSlotsForDay(req, res);
});

router.post("/", (req, res) => {
  bookingController.upsertAvailability(req, res);
});

// router.get("/available", (req, res) => {
//   bookingController.getAvailableSlots(req, res);
// });

// router.post("/book", (req, res) => {
//   bookingController.bookSlot(req, res);
// });

export default router;
