import { Worker } from "bullmq";
import { generateSlots } from "./helper";
import prisma from "../config/prisma";
import Redis from "ioredis";
import logger from "./logger";

logger.info({ message: "Redis worker thread started" });
const redis = new Redis(process.env.REDIS_HOST as string, {
  maxRetriesPerRequest: null,
});
const worker = new Worker(
  "Slot",
  async ({ data }: any) => {
    logger.info({ message: "Generating slots..." });
    let slots = generateSlots(
      data.updatedAvailabilities,
      data.interval,
      data.doctorId
    );
    await prisma.$transaction(async (trx) => {
      await trx.slot.deleteMany({
        where: {
          doctorId: data.doctorId,
          isBooked: false,
        },
      });
      await trx.slot.createMany({
        data: slots,
      });
    });
  },
  { connection: redis }
);

worker.on("completed", async (data: any) => {
  logger.info({ message: "Slots generated successfully" });
  console.log(data.id);
});

worker.on("failed", (job: any, err) => {
  console.log(`${job.id} has failed with ${err.message}`);
});
