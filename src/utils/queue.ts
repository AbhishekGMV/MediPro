import { Queue, Worker } from "bullmq";
import { generateSlots } from "./helper";
import prisma from "../config/prisma";
import Redis from "ioredis";
import logger from "./logger";
import { SLOT_GEN_QUEUE } from "./constants";

logger.info({ message: "Redis worker thread started" });
const redis = new Redis(process.env.REDIS_HOST as string, {
  maxRetriesPerRequest: null,
});

let worker: any;
try {
  worker = new Worker(
    SLOT_GEN_QUEUE,
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
} catch (err) {
  logger.error({ message: "Error generating slots" });
}

worker.on("completed", async (data: any) => {
  logger.info({ message: "Slots generated successfully" });
});

worker.on("failed", (job: any, err: Error) => {
  console.log(`${job.id} has failed with ${err.message}`);
});

export const queue = new Queue(SLOT_GEN_QUEUE, { connection: redis });
