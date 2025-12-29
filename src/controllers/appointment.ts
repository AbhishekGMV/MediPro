import moment from "moment";
import prisma from "../config/prisma";
import { Status } from "../utils/status";
import { Request, Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { AppointmentSchema } from "../schemas/appointment.schema";
import { isSlotWithinAvailability } from "../utils/helper";
import logger from "../utils/logger";
import { AppointmentStatus } from "../utils/constants";

export const getAppointmentList = async (
  _req: Request<{}, any, any, ParsedQs, Record<string, any>>,
  res: Response<any, Record<string, any>, number>
): Promise<any> => {
  try {
    return res.json({
      status: Status.SUCCESS,
      data: await prisma.appointment.findMany({
        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true,
          doctor: {
            select: {
              name: true,
              specialization: true,
              phone: true,
              imageUrl: true,
            },
          },
          patient: {
            select: {
              name: true,
              age: true,
            },
          },
        },
      }),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: Status.ERROR, message: err });
  }
};

export const createAppointment = async (
  req: Request<{}, any, any, ParsedQs, Record<string, any>>,
  res: Response<any, Record<string, any>, number>
): Promise<any> => {
  const patientId = (req as any).user.id as string;
  const result = AppointmentSchema.safeParse(req);
  if (!result.success) {
    return res
      .status(400)
      .json({ status: Status.FAILED, message: result.error.errors });
  }
  let { doctorId, startTime, endTime } = req.body;
  startTime = new Date(startTime);
  endTime = new Date(endTime);
  const dayOfWeek = startTime.getUTCDay();

  if (startTime >= endTime) {
    return res.status(400).json({
      status: Status.FAILED,
      message: "Invalid time range for appointment.",
    });
  }

  try {
    const availability = await prisma.availability.findFirst({
      where: {
        doctorId,
        dayOfWeek,
        effectiveTo: null,
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    if (!availability) {
      return res.status(400).json({
        status: Status.FAILED,
        message: "Failed to create appointment. Doctor unavailable.",
      });
    }

    if (
      !isSlotWithinAvailability(
        startTime,
        endTime,
        availability.startTime,
        availability.endTime
      )
    ) {
      return res.status(400).json({
        status: Status.FAILED,
        message:
          "Failed to create appointment. Slot outside doctor's availability.",
      });
    }

    const doctorLeave = await prisma.doctorLeave.findFirst({
      where: {
        doctorId,
        date: new Date(moment(startTime).format("YYYY-MM-DD")),
      },
    });

    if (doctorLeave != null) {
      return res.status(400).json({
        status: Status.FAILED,
        message: "Failed to create appointment. Doctor unavailable.",
      });
    }

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId,
        startTime: {
          lt: new Date(endTime),
        },
        endTime: {
          gt: new Date(startTime),
        },
      },
    });

    if (existingAppointment) {
      return res.status(400).json({
        status: Status.FAILED,
        message: "Failed to create appointment. Slot already booked.",
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        doctorId,
        patientId,
        status: AppointmentStatus.CONFIRMED,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });

    if (!appointment) {
      return res.status(500).json({
        status: Status.ERROR,
        message: "Failed to create appointment",
      });
    }

    return res.status(201).json({
      status: Status.SUCCESS,
      message: "Appointment created successfully",
    });
  } catch (err) {
    logger.error({ message: "Failed to book appointment", error: err });
    return res
      .status(500)
      .json({ status: Status.ERROR, message: (err as Error).message });
  }
};

export const cancelAppointment = async (
  req: Request<{ id: string }, any, any, ParsedQs, Record<string, any>>,
  res: Response<any, Record<string, any>, number>
): Promise<any> => {
  const { id } = req.params;

  try {
    const existingAppointment = await prisma.appointment.findUnique({
      where: {
        id,
      },
    });

    if (!existingAppointment) {
      return res
        .status(404)
        .json({ status: Status.FAILED, message: "Appointment not found" });
    }

    const appointment = await prisma.appointment.update({
      data: { status: AppointmentStatus.CANCELLED },
      where: { id },
    });

    if (appointment.status !== AppointmentStatus.CANCELLED) {
      return res.status(500).json({
        status: Status.ERROR,
        message: "Failed to cancel appointment",
      });
    }

    return res.status(200).json({
      status: Status.SUCCESS,
      message: "Appointment cancelled successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: Status.ERROR, message: err });
  }
};

export const getAppointmentWithID = async (
  req: Request<{ id: string }, any, any, ParsedQs, Record<string, any>>,
  res: Response<any, Record<string, any>, number>
): Promise<any> => {
  const id = req.params.id;
  const { date, status } = req.query;
  const filters: any = { id };

  if (date) {
    const startOfDay = moment(date as string)
      .startOf("day")
      .toDate();
    const endOfDay = moment(date as string)
      .endOf("day")
      .toDate();
    filters.startTime = { gte: startOfDay };
    filters.endTime = { lte: endOfDay };
  }

  if (status) {
    filters.status = status;
  }

  try {
    const appointments = await prisma.appointment.findUnique({
      where: filters,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        doctor: {
          select: {
            name: true,
            specialization: true,
            phone: true,
            imageUrl: true,
          },
        },
        patient: {
          select: {
            name: true,
            age: true,
            gender: true,
            phone: true,
            imageUrl: true,
          },
        },
      },
    });
    return res.status(200).json({ status: Status.SUCCESS, data: appointments });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: Status.ERROR, message: err });
  }
};

export const getDoctorAppointmentList = async (
  req: Request<{ id: string }, any, any, ParsedQs, Record<string, any>>,
  res: Response<any, Record<string, any>, number>
): Promise<any> => {
  const id = req.params.id;
  const { date, status, patientId } = req.query;
  const filters: any = { doctorId: id };

  if (date) {
    const startOfDay = moment(date as string)
      .startOf("day")
      .toDate();
    const endOfDay = moment(date as string)
      .endOf("day")
      .toDate();
    filters.startTime = { gte: startOfDay };
    filters.endTime = { lte: endOfDay };
  }

  if (status) {
    filters.status = status;
  }

  if (patientId) {
    filters.patientId = patientId;
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where: filters,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        patient: {
          select: {
            name: true,
            age: true,
            gender: true,
            phone: true,
            imageUrl: true,
          },
        },
      },
    });
    return res.status(200).json({ status: Status.SUCCESS, data: appointments });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: Status.ERROR, message: err });
  }
};

export const getPatientAppointmentList = async (
  req: Request<{ id: string }, any, any, ParsedQs, Record<string, any>>,
  res: Response<any, Record<string, any>, number>
): Promise<any> => {
  const id = req.params.id;
  const { date, status, doctorId } = req.query;
  const filters: any = { patientId: id };

  if (date) {
    const startOfDay = moment(date as string)
      .startOf("day")
      .toDate();
    const endOfDay = moment(date as string)
      .endOf("day")
      .toDate();
    filters.startTime = { gte: startOfDay };
    filters.endTime = { lte: endOfDay };
  }

  if (status) {
    filters.status = status;
  }

  if (doctorId) {
    filters.doctorId = doctorId;
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where: filters,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        doctor: {
          select: {
            name: true,
            gender: true,
            phone: true,
            imageUrl: true,
          },
        },
      },
    });
    return res.status(200).json({ status: Status.SUCCESS, data: appointments });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: Status.ERROR, message: err });
  }
};
