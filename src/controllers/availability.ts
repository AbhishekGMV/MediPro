import { Status } from "../utils/status";
import { Request, Response } from "express-serve-static-core";
import logger from "../utils/logger";
import prisma from "../config/prisma";
import { AvailabilitySchema } from "../schemas/availability.schema";
import { timeToDate } from "../utils/helper";

// export const getAvailability = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   try {
//     const doctorId = req.headers.id as string;
//     const weekStart = req.query.weekStart as string;
//     const availabilities = await prisma.availability.findMany({
//       where: { doctorId, weekStart },
//       select: {
//         startTime: true,
//         endTime: true,
//         dayOfWeek: true,
//         id: true,
//       },
//     });
//     return res
//       .status(200)
//       .json({ status: Status.SUCCESS, data: availabilities });
//   } catch (err) {
//     return res.status(500).json({ status: Status.ERROR, message: err });
//   }
// };

// export const getAvailableSlotsForDay = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   try {
//     const { id: doctorId, dayOfWeek } = req.query;
//     const availabilities = await prisma.slot.findMany({
//       where: { doctorId: doctorId as string, dayOfWeek: dayOfWeek as string },
//       select: {
//         dayOfWeek: true,
//         startTime: true,
//         endTime: true,
//         id: true,
//       },
//     });
//     return res
//       .status(200)
//       .json({ status: Status.SUCCESS, data: availabilities });
//   } catch (err) {
//     return res.status(500).json({ status: Status.ERROR, message: err });
//   }
// };

export const upsertAvailability = async (
  req: Request,
  res: Response
): Promise<any> => {
  const result = AvailabilitySchema.safeParse(req);
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
