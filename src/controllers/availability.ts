import { Status } from "../utils/status";
import { Request, Response } from "express-serve-static-core";
import logger from "../utils/logger";
import prisma from "../config/prisma";
import { AvailabilitySchema } from "../schemas/availability.schema";
import { queue } from "../utils/queue";
import { SLOT_GEN_QUEUE } from "../utils/constants";

export const getAvailability = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const doctorId = req.headers.id as string;
    const weekStart = req.query.weekStart as string;
    const availabilities = await prisma.availability.findMany({
      where: { doctorId, weekStart },
      select: {
        startTime: true,
        endTime: true,
        dayOfWeek: true,
        id: true,
      },
    });
    return res
      .status(200)
      .json({ status: Status.SUCCESS, data: availabilities });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: Status.ERROR, message: err });
  }
};

export const upsertAvailability = async (
  req: Request,
  res: Response
): Promise<any> => {
  const result = AvailabilitySchema.safeParse(req);
  if (!result.success) {
    return res.status(400).json(result);
  }
  const { availabilities, interval, weekStart } = req.body;
  const doctorId = req.headers.id as string;

  try {
    const updatedAvailabilities = await prisma.$transaction(
      availabilities.map((availability: any) =>
        prisma.availability.upsert({
          where: {
            doctorId_dayOfWeek: {
              doctorId,
              dayOfWeek: availability.dayOfWeek,
            },
          },
          create: { ...availability, doctorId, weekStart },
          update: {
            startTime: availability.startTime,
            endTime: availability.endTime,
          },
        })
      )
    );
    logger.info({ message: "Availability updated, queuing slot generation" });
    queue.add(SLOT_GEN_QUEUE, { updatedAvailabilities, interval, doctorId });

    return res.status(200).json({
      status: Status.SUCCESS,
      message: "Availability updated successfully",
      data: updatedAvailabilities,
    });
  } catch (err) {
    logger.error({ message: (err as Error).message });
    return res.status(500).json({
      status: Status.INTERNAL_SERVER_ERROR,
      message: "Failed to update slots",
    });
  }
  // TODO: validation for start time and end time
};
