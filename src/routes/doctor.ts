import express from "express";
import * as doctorController from "../controllers/doctor";
import multer from "multer";
import { auth, role } from "../middleware/auth";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { UserRole } from "../utils/constants";

const router: any = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get(
  "/",
  auth,
  role(UserRole.DOCTOR, UserRole.PATIENT),
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
    void doctorController.getDoctorsList(req, res);
  }
);

router.get(
  "/me",
  auth,
  role(UserRole.DOCTOR),
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
    void doctorController.getDoctor(req, res);
  }
);

router.patch(
  "/:id",
  auth,
  role(UserRole.DOCTOR),
  upload.single("signature"),
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
    void doctorController.handleSignatureFileUpload(req, res);
  }
);

router.delete(
  "/:id",
  auth,
  role(UserRole.DOCTOR),
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
    void doctorController.deleteDoctorWithID(req, res);
  }
);

router.post(
  "/get-doctor-with-role",
  auth,
  role(UserRole.DOCTOR),
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
    void doctorController.getDoctorWithRole(req, res);
  }
);

router.post(
  "/register",
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
    void doctorController.handleDoctorRegister(req, res);
  }
);

router.post(
  "/login",
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
    void doctorController.handleDoctorLogin(req, res);
  }
);

router.get(
  "/availability",
  auth,
  role(UserRole.DOCTOR),
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
    doctorController.getAvailability(req, res);
  }
);

router.post(
  "/availability",
  auth,
  role(UserRole.DOCTOR),
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
    doctorController.upsertAvailability(req, res);
  }
);

router.post(
  "/:id/leave",
  auth,
  role(UserRole.DOCTOR),
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
    doctorController.addDoctorLeave(req, res);
  }
);

router.get(
  "/:id/slots",
  auth,
  role(UserRole.DOCTOR, UserRole.PATIENT),
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
    doctorController.getAvailableSlots(req, res);
  }
);

router.get(
  "/:id/signature",
  auth,
  role(UserRole.DOCTOR),
  (req: any, res: any) => {
    doctorController.getDoctorSignatureUrl(req, res);
  }
);

export default router;
