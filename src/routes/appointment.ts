import express from "express";
import * as appointmentController from "../controllers/appointment";
import { auth } from "../middleware/auth";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
const router: any = express.Router();

router.get(
  "/",
  auth,
  (
    req: express.Request<
      ParamsDictionary,
      any,
      any,
      ParsedQs,
      Record<string, any>
    >,
    res: express.Response<any, Record<string, any>>
  ) => {
    void appointmentController.getAppointmentList(req, res);
  }
);

router.get(
  "/:id",
  auth,
  (
    req: express.Request<
      { id: string },
      any,
      any,
      ParsedQs,
      Record<string, any>
    >,
    res: express.Response<any, Record<string, any>>
  ) => {
    appointmentController.getAppointmentWithID(req, res);
  }
);

router.get(
  "/patient/:id",
  auth,
  (
    req: express.Request<
      { id: string },
      any,
      any,
      ParsedQs,
      Record<string, any>
    >,
    res: express.Response<any, Record<string, any>>
  ) => {
    appointmentController.getPatientAppointmentList(req, res);
  }
);

router.get(
  "/doctor/:id",
  auth,
  (
    req: express.Request<
      { id: string },
      any,
      any,
      ParsedQs,
      Record<string, any>
    >,
    res: express.Response<any, Record<string, any>>
  ) => {
    appointmentController.getDoctorAppointmentList(req, res);
  }
);

router.post(
  "/book",
  auth,
  (
    req: express.Request<
      ParamsDictionary,
      any,
      any,
      ParsedQs,
      Record<string, any>
    >,
    res: express.Response<any, Record<string, any>>
  ) => {
    appointmentController.createAppointment(req, res);
  }
);

router.patch(
  "/:id/cancel",
  auth,
  (
    req: express.Request<
      { id: string },
      any,
      any,
      ParsedQs,
      Record<string, any>
    >,
    res: express.Response<any, Record<string, any>>
  ) => {
    appointmentController.cancelAppointment(req, res);
  }
);

export default router;
