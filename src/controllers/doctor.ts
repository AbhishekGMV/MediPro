import prisma from "../config/prisma";
import { type Request, type Response } from "express";
import { Status } from "../utils/status";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  DoctorAvailabilitySchema,
  DoctorLeaveSchema,
  doctorLoginSchema,
  doctorRegisterSchema,
  doctorSignatureFileUpdateSchema,
} from "../schemas/doctor.schema";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import logger from "../utils/logger";
import moment from "moment";
import {
  generateSlots,
  getPreSignedUrl,
  overlaps,
  timeParts,
  timeToDate,
  uploadFile,
} from "../utils/helper";
import { s3client } from "../config/storage";

export const getDoctorsList = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  try {
    return res.json({
      status: Status.SUCCESS,
      data: await prisma.doctor.findMany(),
    });
  } catch (error) {
    logger.error({ message: "Failed to fetch doctors list", error });
    return res.json({
      status: "Failed",
      code: 500,
      message: "Internal Server Error",
      errors: [
        {
          code: "INTERNAL_SERVER_ERROR",
          message: error,
        },
      ],
    });
  }
};

export const getDoctorWithID = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const id = req.params.id;

  const doctor = await prisma.doctor.findUnique({ where: { id } });
  return res.json({
    status: Status.SUCCESS,
    data: { ...doctor, password: undefined },
  });
};

/**
 * Function to handle doctor login
 * @param req - Request
 * @param res - Response
 * @returns  Response
 */
export const handleDoctorLogin = async (
  req: Request,
  res: Response
): Promise<Response<void>> => {
  const result = doctorLoginSchema.safeParse(req.body);
  if (!result.success) {
    logger.warn(result.error);
    return res
      .status(400)
      .json({ status: Status.BAD_REQUEST, message: "Invalid request body" });
  }
  const { phone, password } = req.body.user;
  const doctor = await prisma.doctor.findUnique({ where: { phone } });
  if (!doctor) {
    return res
      .status(404)
      .json({ status: Status.FAILED, message: "User not found" });
  }
  const isPasswordValid = await bcrypt.compare(password, doctor.password);
  if (!isPasswordValid) {
    logger.warn({ message: "Invalid credentials" });
    return res
      .status(401)
      .json({ status: Status.FAILED, message: "Invalid credentials" });
  }

  try {
    const token = jwt.sign(
      { id: doctor.id },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1h",
      }
    );
    return res.status(200).json({
      status: Status.SUCCESS,
      message: "Login successful",
      data: { token, id: doctor.id, name: doctor.name },
    });
  } catch (err: any) {
    logger.error({
      message: "login failed",
      error: err.name,
      description: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ status: Status.ERROR, message: err });
  }
};

export const handleDoctorRegister = async (
  req: Request,
  res: Response
): Promise<Response<void>> => {
  const result = doctorRegisterSchema.safeParse(req);
  const { user } = req.body;
  if (!result.success) {
    logger.error({ error: result.error });
    return res
      .status(400)
      .json({ status: Status.FAILED, message: result.error });
  }

  try {
    let doctor = await prisma.doctor.findUnique({
      where: { phone: user.phone },
    });
    if (doctor) {
      logger.warn({
        message: "User already exists",
      });
      return res
        .status(400)
        .json({ status: Status.FAILED, message: "User already exists" });
    }
    user.password = await bcrypt.hash(user.password, 10);
    const response = await prisma.doctor.create({
      data: user,
      select: {
        id: true,
        name: true,
        phone: true,
        specialization: true,
      },
    });
    logger.info({
      message: "Doctor registered successfully",
    });
    return res.status(201).json({
      status: Status.SUCCESS,
      message: "Doctor registered successfully",
      data: { ...response, password: undefined },
    });
  } catch (err: any) {
    logger.error({
      message: "Failed to register doctor",
      error: err.name,
      description: err.message,
      stack: err.stack,
    });
    return res.status(500).json({
      status: Status.INTERNAL_SERVER_ERROR,
      message: "Failed to register doctor",
    });
  }
};

export const handleSignatureFileUpload = async (
  req: Request,
  res: Response
): Promise<Response<void>> => {
  try {
    const schemaValidation = doctorSignatureFileUpdateSchema.safeParse(req);
    const { id } = req.params;

    if (!schemaValidation.success || req.file === undefined) {
      logger.error({ error: schemaValidation.error });
      return res
        .status(400)
        .json({ status: Status.FAILED, message: schemaValidation.error });
    }
    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      logger.info({
        message: "User not found",
      });
      return res
        .status(400)
        .json({ status: Status.FAILED, message: "User not found" });
    }
    const { key } = await uploadFile({
      bucket: process.env.S3_BUCKET_NAME as string,
      key: `signatures/${doctor.id}-${req.file.originalname}`,
      body: req.file.buffer,
      contentType: req.file.mimetype,
    });
    if (!key) {
      throw new Error("File upload failed");
    }
    const result = await prisma.doctor.update({
      where: { id: doctor.id },
      data: { signatureUrl: key },
      select: {
        id: true,
        signatureUrl: true,
      },
    });
    logger.info({ message: "Doctor data update successful" });
    return res.status(200).json({
      status: Status.SUCCESS,
      message: "Doctor data update successful",
      data: result,
    });
  } catch (err: any) {
    logger.error({
      message: "Failed to upload signature file",
      error: err.name,
      description: err.message,
      stack: err.stack,
    });
    return res.status(500).json({
      status: Status.INTERNAL_SERVER_ERROR,
      message: "Failed to upload signature file",
    });
  }
};

export const getDoctorWithRole = async (
  req: Request,
  res: Response
): Promise<Response<void>> => {
  const role: string = req.body.role;
  if (!role) {
    return res
      .status(400)
      .json({ status: Status.FAILED, message: "Role is required" });
  }
  const doctor = await prisma.doctor.findFirst({
    where: { specialization: role },
  });
  return res
    .status(200)
    .json({ status: Status.SUCCESS, data: { ...doctor, password: undefined } });
};

export const deleteDoctorWithID = async (
  req: Request,
  res: Response
): Promise<Response<void>> => {
  const id = req.params.id;
  const doctor = await prisma.doctor.findUnique({
    where: { id },
  });
  if (doctor === null) {
    return res
      .status(404)
      .json({ status: "Not found", message: "No doctor found for given id" });
  }
  if (doctor.signatureUrl) {
    const response = await s3client.send(
      new DeleteObjectCommand({
        Bucket: process.env.SIGNATURES_BUCKET as string,
        Key: `${doctor.id}_signature.png`,
      })
    );
    if (response.$metadata.httpStatusCode !== 204) {
      logger.warn({
        message: "Failed to delete signature file",
        doctorId: doctor.id,
      });
    }
  }
  //using raw query to delete as there is a bug in prisma delete on cascade
  const data = await prisma.doctor.delete({ where: { id } });
  return res.json({
    status: "Success",
    message: "Doctor deleted successfully",
    id,
  });
};

export const addDoctorLeave = async (
  req: Request,
  res: Response
): Promise<Response<void>> => {
  const doctorId = req.params.id;
  const { date } = req.body;

  const result = DoctorLeaveSchema.safeParse(req);
  if (!result.success) {
    logger.error({ error: result.error });
    return res
      .status(400)
      .json({ status: Status.FAILED, message: result.error });
  }

  try {
    await prisma.doctorLeave.create({
      data: {
        doctorId,
        date: new Date(date),
      },
    });

    logger.info({ message: "Leave added successfully" });
    return res
      .status(200)
      .json({ status: Status.SUCCESS, message: "Leave added successfully" });
  } catch (err) {
    logger.error({ message: "Failed to update leave", error: err });
    return res.status(500).json({ status: Status.ERROR, message: err });
  }
};

export const upsertAvailability = async (
  req: Request,
  res: Response
): Promise<any> => {
  const result = DoctorAvailabilitySchema.safeParse(req);
  if (!result.success) {
    return res.status(400).json(result);
  }
  const { interval, weeklyAvailability } = req.body;
  const doctorId = req.headers.id as string;

  try {
    await prisma.availability.updateMany({
      where: { doctorId, effectiveTo: null },
      data: { effectiveTo: new Date() },
    });

    await Promise.all(
      weeklyAvailability.map(async (availability: any) => {
        return prisma.availability.create({
          data: {
            doctorId,
            dayOfWeek: availability.dayOfWeek,
            startTime: timeToDate(availability.startTime),
            endTime: timeToDate(availability.endTime),
            effectiveFrom: new Date(),
            effectiveTo: null,
            slotDuration: interval,
          },
        });
      })
    );

    logger.info({ message: "Availability updated successfully" });
    return res
      .status(200)
      .json({ status: Status.SUCCESS, message: "Availability updated" });
  } catch (err) {
    logger.error({ message: "Failed to update availability", error: err });
    return res.status(500).json({ status: Status.ERROR, message: err });
  }
};

export const getAvailableSlots = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { date } = req.query;
    const doctorId = req.params.id;

    const availability = await prisma.availability.findFirst({
      where: {
        doctorId: doctorId as string,
        dayOfWeek: moment(date as string).day(),
        effectiveTo: null,
      },
      select: {
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        slotDuration: true,
      },
    });

    if (availability === null) {
      return res.status(200).json({ status: Status.SUCCESS, data: [] });
    }

    let dayStart = new Date(`${date}T00:00:00.000Z`);
    let dayEnd = new Date(`${date}T00:00:00.000Z`);
    dayStart.setUTCHours(
      timeParts(availability.startTime).hours,
      timeParts(availability.startTime).minutes,
      0,
      0
    );
    dayEnd.setUTCHours(
      timeParts(availability.endTime).hours,
      timeParts(availability.endTime).minutes,
      0,
      0
    );

    const leaves = await prisma.doctorLeave.findFirst({
      where: {
        doctorId: doctorId as string,
        date: new Date(moment(date as string).format("YYYY-MM-DD")),
      },
    });

    if (leaves != null) {
      return res.status(200).json({ status: Status.SUCCESS, data: [] });
    }

    const { slotDuration } = availability;
    const slots = generateSlots(
      { startTime: dayStart, endTime: dayEnd },
      slotDuration
    );

    const bookedSlots = await prisma.appointment.findMany({
      where: {
        doctorId: doctorId as string,
        startTime: {
          lt: dayEnd,
        },
        endTime: {
          gt: dayStart,
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    const availableSlots = slots.filter((slot) => {
      return !bookedSlots.some((bookedSlot) =>
        overlaps(
          slot.startTime,
          slot.endTime,
          bookedSlot.startTime,
          bookedSlot.endTime
        )
      );
    });

    return res.status(200).json({
      status: Status.SUCCESS,
      data: {
        doctorId,
        date,
        dayOfWeek: moment(date as string).day(),
        slots: availableSlots,
      },
    });
  } catch (err) {
    logger.error({ message: "Failed to get slots", error: err });
    return res.status(500).json({
      status: Status.ERROR,
      message: "Failed to get slots",
      error: err,
    });
  }
};

export const getDoctorSignatureUrl = async (
  req: { params: { id: string } },
  res: any
): Promise<void> => {
  const doctorId = req.params.id;

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { signatureUrl: true },
    });

    if (!doctor || !doctor.signatureUrl) {
      return res
        .status(404)
        .json({ status: Status.NOT_FOUND, message: "Signature not found" });
    }

    return res.status(200).json({
      status: Status.SUCCESS,
      data: { signatureUrl: await getPreSignedUrl(doctor.signatureUrl) },
    });
  } catch (err) {
    return res.status(500).json({
      status: Status.ERROR,
      message: (err as Error).message,
    });
  }
};
