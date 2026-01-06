import express from "express";
import patientRouter from "./patient.js";
import doctorRouter from "./doctor.js";
import consultationRouter from "./consultation.js";
import appointmentRouter from "./appointment.js";
import { auth } from "../middleware/auth.js";
import assignInteractionId from "../middleware/flow-control.js";
import {
  logCaughtExceptionMiddleware,
  logRequestMiddleware,
} from "../middleware/logger.js";

const router: any = express.Router();

router.use(assignInteractionId);

router.use(logRequestMiddleware);

router.use("/patient", patientRouter);

router.use("/doctor", doctorRouter);

router.use("/consultation", auth, consultationRouter);

router.use("/appointment", auth, appointmentRouter);

router.use(logCaughtExceptionMiddleware);

export default router;
