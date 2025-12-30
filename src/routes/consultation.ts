import express from "express";
import * as consultationController from "../controllers/consultation";
import multer from "multer";
import { auth } from "../middleware/auth";
const router: any = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", auth, (req: any, res: any) => {
  consultationController.getConsultationList(req, res);
});

router.get("/:id", auth, (req: any, res: any) => {
  consultationController.getConsultationWithID(req, res);
});

router.put("/complete/:id", auth, (req: any, res: any) => {
  consultationController.completeConsultation(req, res);
});

router.get("/patient/:id", auth, (req: any, res: any) => {
  consultationController.getPatientConsultation(req, res);
});

router.get("/doctor/:id", auth, (req: any, res: any) => {
  consultationController.getDoctorConsultation(req, res);
});

router.post("/", auth, (req: any, res: any) => {
  consultationController.createConsultationMetaData(req, res);
});

router.post(
  "/prescription",
  upload.single("prescription"),
  auth,
  (req: any, res: any) => {
    consultationController.handlePrescriptionFileUpload(req, res);
  }
);

router.put("/prescription-content", auth, (req: any, res: any) => {
  consultationController.updatePrescriptionContent(req, res);
});

router.get("/:id/prescription", auth, (req: any, res: any) => {
  consultationController.getPrescriptionUrl(req, res);
});

export default router;
