import { Worker } from "bullmq";
import { generateSlots } from "./helper";
import prisma from "../config/prisma";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_HOST as string, {
  maxRetriesPerRequest: null,
});
const worker = new Worker(
  "Slot",
  async ({ data }: any) => {
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
  { connection: redis, concurrency: 5 }
);

worker.on("completed", async (data: any) => {
  console.log(data.id);
});

worker.on("failed", (job: any, err) => {
  console.log(`${job.id} has failed with ${err.message}`);
});
