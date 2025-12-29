import { Status } from "../utils/status";
import prisma from "../config/prisma";
import { Request, Response } from "express";
import logger from "../utils/logger";
import {
  consultationMetaDataSchema,
  consultationSchema,
  prescriptionSchema,
} from "../schemas/consultation.schema";
import {
  getFormattedSpeechData,
  getPreSignedUrl,
  uploadFile,
} from "../utils/helper";
import { AppointmentStatus } from "../utils/constants";

export const getConsultationList = async (
  req: any,
  res: any
): Promise<void> => {
  try {
    const data = await prisma.consultation.findMany({
      select: {
        id: true,
        appointmentId: true,
        prescriptionUrl: true,
        prescriptionContent: true,
      },
    });
    return res.status(200).json({
      status: Status.SUCCESS,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      status: Status.ERROR,
      message: (err as Error).message,
    });
  }
};

export const getConsultationWithID = async (
  req: { params: { id: any } },
  res: any
): Promise<void> => {
  const id = req.params.id;
  try {
    const data = await prisma.consultation.findUnique({
      where: { id },
      select: {
        id: true,
        appointmentId: true,
        prescriptionUrl: true,
        prescriptionContent: true,
      },
    });
    return res.status(200).json({
      status: Status.SUCCESS,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      status: Status.ERROR,
      message: (err as Error).message,
    });
  }
};

export const getPatientConsultation = async (
  req: { params: { id: any } },
  res: any
): Promise<void> => {
  const id = req.params.id;

  try {
    const data = await prisma.consultation.findMany({
      where: { patientId: id },
      select: {
        appointmentId: true,
        prescriptionUrl: true,
        prescriptionContent: true,
        doctor: {
          select: {
            name: true,
            specialization: true,
          },
        },
      },
    });
    return res.status(200).json({
      status: Status.SUCCESS,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      status: Status.ERROR,
      message: (err as Error).message,
    });
  }
};

export const getDoctorConsultation = async (
  req: { params: { id: any } },
  res: any
): Promise<void> => {
  const id = req.params.id;

  try {
    const data = await prisma.consultation.findMany({
      where: { doctorId: id },
      include: {
        patient: {
          select: {
            name: true,
          },
        },
      },
    });
    return res.status(200).json({
      status: Status.SUCCESS,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      status: Status.ERROR,
      message: (err as Error).message,
    });
  }
};

export const createConsultationMetaData = async (
  req: Request,
  res: Response
) => {
  const doctorId = req.headers.id as string;
  const result = consultationMetaDataSchema.safeParse(req.body);
  if (!result.success) {
    return res
      .status(400)
      .json({ status: Status.BAD_REQUEST, message: result.error });
  }
  const { patientId, appointmentId } = req.body.payload;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId as string },
  });
  if (!patient) {
    return res
      .status(400)
      .json({ status: Status.BAD_REQUEST, message: "Invalid patient id" });
  }
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId as string },
  });
  if (!appointment) {
    return res
      .status(400)
      .json({ status: Status.BAD_REQUEST, message: "Invalid appointment id" });
  }
  try {
    const result = await prisma.consultation.upsert({
      where: {
        doctorId,
        appointmentId,
      },
      update: {
        patientId,
        doctorId,
        appointmentId,
      },
      create: {
        patientId,
        doctorId,
        appointmentId,
      },
      select: {
        id: true,
      },
    });
    return res.status(200).json({
      status: Status.SUCCESS,
      message: "Consultation info updated",
      data: result,
    });
  } catch (err) {
    logger.error({ message: (err as Error).message });
    return res.status(500).json({
      status: Status.INTERNAL_SERVER_ERROR,
      message: "Failed to update consultation details",
    });
  }
};

export const handlePrescriptionFileUpload = async (
  req: Request,
  res: Response
): Promise<any> => {
  const result = prescriptionSchema.safeParse(req);
  if (!result.success) {
    return res
      .status(400)
      .json({ status: Status.BAD_REQUEST, message: result.error });
  }
  const consultation = await prisma.consultation.findUnique({
    where: { id: req.query.consultationId as string },
  });
  if (!consultation || !req.file) {
    return res
      .status(400)
      .json({ status: Status.BAD_REQUEST, message: "Invalid consultation id" });
  }

  try {
    const { key } = await uploadFile({
      bucket: process.env.S3_BUCKET_NAME as string,
      key: `prescriptions/${consultation.id}-${req.file.originalname}`,
      body: req.file.buffer,
      contentType: req.file.mimetype,
    });
    if (!key) {
      throw new Error("File upload failed");
    }

    const result = await prisma.consultation.update({
      where: { id: consultation.id },
      data: {
        prescriptionUrl: key,
      },
      select: { id: true, prescriptionUrl: true },
    });
    return res.status(200).json({
      status: Status.SUCCESS,
      message: "Prescription file updated",
      data: result,
    });
  } catch (err) {
    logger.error({ message: (err as Error).message });
    return res.status(500).json({
      status: Status.INTERNAL_SERVER_ERROR,
      message: "Failed to upload prescription file",
    });
  }
};

export const updatePrescriptionContent = async (
  req: Request,
  res: Response
): Promise<any> => {
  const result = consultationSchema.safeParse(req.body);
  const { id, prescription } = req.body.payload;
  const { content } = prescription;
  if (!result.success) {
    return res
      .status(400)
      .json({ status: Status.BAD_REQUEST, message: result.error });
  }
  try {
    const consultation = await prisma.consultation.update({
      where: { id },
      data: {
        prescriptionContent: getFormattedSpeechData(content) as string,
      },
      select: { id: true, prescriptionContent: true, prescriptionUrl: true },
    });
    return res
      .status(200)
      .json({ message: "Prescription content updated", data: consultation });
  } catch (err) {
    logger.error({ message: (err as Error).message });
    return res.status(500).json({
      status: Status.INTERNAL_SERVER_ERROR,
      message: "Failed to upload prescription file",
    });
  }
};

export const completeConsultation = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const data = await prisma.$transaction(async (trx) => {
      const consultation = await trx.consultation.findUnique({
        where: { id: req.params.id },
      });

      if (!consultation) {
        return res
          .status(404)
          .json({ success: false, message: "Consultation not found." });
      }

      const appointment = await trx.appointment.update({
        where: { id: consultation.appointmentId },
        data: {
          status: AppointmentStatus.COMPLETED,
        },
      });
    });
    res.json({
      status: Status.SUCCESS,
      message: "Consultation completed",
      data,
    });
  } catch (err) {
    logger.error({ message: (err as Error).message });
    res.status(500).json({
      status: Status.INTERNAL_SERVER_ERROR,
      message: "Failed to update consultation details",
    });
  }
};

export const getPrescriptionUrl = async (
  req: { params: { id: any } },
  res: any
): Promise<void> => {
  const id = req.params.id;
  try {
    const consultation = await prisma.consultation.findUnique({
      where: { id },
      select: { prescriptionUrl: true },
    });
    if (!consultation) {
      return res.status(404).json({
        status: Status.NOT_FOUND,
        message: "Consultation not found",
      });
    }
    if (!consultation.prescriptionUrl) {
      return res.status(404).json({
        status: Status.NOT_FOUND,
        message: "Prescription file not found",
      });
    }
    return res.status(200).json({
      status: Status.SUCCESS,
      data: await getPreSignedUrl(consultation.prescriptionUrl),
    });
  } catch (err) {
    return res.status(500).json({
      status: Status.ERROR,
      message: (err as Error).message,
    });
  }
};
