import express from "express";

import * as patientController from "../controllers/patient";
import { auth, role } from "../middleware/auth";
import { ParamsDictionary, Request, Response } from "express-serve-static-core";
import { UserRole } from "../utils/constants";
import { ParsedQs } from "qs";

const router: any = express.Router();

router.get(
  "/me",
  auth,
  role(UserRole.PATIENT),
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
    void patientController.getPatient(req, res);
  }
);

router.get("/", auth, (req: Request, res: Response) => {
  void patientController.getPatientsList(req, res);
});

router.put("/", auth, (req: Request, res: Response) => {
  patientController.updatePatientRegister(req, res);
});

router.get(
  "/:id",
  auth,
  role(UserRole.PATIENT),
  (req: Request, res: Response) => {
    patientController.getPatientWithID(req, res);
  }
);

router.post("/register", (req: Request, res: Response) => {
  patientController.handlePatientRegister(req, res);
});

router.post("/login", (req: Request, res: Response) => {
  patientController.handlePatientLogin(req, res);
});

export default router;
