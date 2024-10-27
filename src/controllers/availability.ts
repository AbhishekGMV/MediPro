import { generateSlots } from "../utils/helper";
import { Status } from "../utils/status";
import { Request, Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import logger from "../utils/logger";
import prisma from "../config/prisma";
import { AvailabilitySchema } from "../schemas/availability.schema";

export const getAvailability = async (
  _req: Request<{}, any, any, ParsedQs, Record<string, any>>,
  res: Response<any, Record<string, any>, number>
): Promise<any> => {
  try {
    const slots = await prisma.slot.findMany();
    return res.status(200).json({ status: Status.SUCCESS, data: slots });
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
  const { availability, interval } = req.body;
  const doctorId = req.headers.id as string;
  try {
    const result = await prisma.$transaction(
      async (trx) => {
        let existingAvailability = await prisma.availability.findFirst({
          where: { doctorId },
        });
        if (!existingAvailability) {
          existingAvailability = await prisma.availability.create({
            data: { doctorId },
          });
        }
        let slots = generateSlots(
          availability,
          interval,
          doctorId,
          existingAvailability.id
        );

        await trx.slot.deleteMany({
          where: { doctorId, availabilityId: existingAvailability.id },
        });
        return await trx.slot.createMany({
          data: slots,
        });
      },
      {
        timeout: 10000,
      }
    );
    return res.status(200).json({
      status: Status.SUCCESS,
      message: "Availability updated successfully!",
      data: result,
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
