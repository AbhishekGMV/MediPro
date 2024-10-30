// import { Worker } from "bullmq";
// import { generateSlots } from "./helper";
// import prisma from "../config/prisma";
// import Redis from "ioredis";
// import logger from "./logger";

import Redis from "ioredis";
import logger from "./logger";
import { generateSlots } from "./helper";
import prisma from "../config/prisma";

// logger.info({ message: "Redis worker thread started" });
// const redis = new Redis(process.env.REDIS_HOST as string, {
//   maxRetriesPerRequest: null,
// });
// const worker = new Worker(
//   "Slot",
//   async ({ data }: any) => {
//     logger.info({ message: "Generating slots..." });
//     let slots = generateSlots(
//       data.updatedAvailabilities,
//       data.interval,
//       data.doctorId
//     );
//     await prisma.$transaction(async (trx) => {
//       await trx.slot.deleteMany({
//         where: {
//           doctorId: data.doctorId,
//           isBooked: false,
//         },
//       });
//       await trx.slot.createMany({
//         data: slots,
//       });
//     });
//   },
//   { connection: redis }
// );

// worker.on("completed", async (data: any) => {
//   logger.info({ message: "Slots generated successfully" });
//   console.log(data.id);
// });

// worker.on("failed", (job: any, err) => {
//   console.log(`${job.id} has failed with ${err.message}`);
// });

const subscriberClient = new Redis(process.env.REDIS_HOST as string);

subscriberClient.subscribe("slot", (error) => {
  if (error) {
    console.error("Failed to subscribe", error);
  }
});

subscriberClient.on("message", async (channel, data) => {
  try {
    const json = JSON.parse(data);
    logger.info({ message: "Generating slots..." });
    let slots = generateSlots(
      json.updatedAvailabilities,
      json.interval,
      json.doctorId
    );
    await prisma.$transaction(async (trx) => {
      await trx.slot.deleteMany({
        where: {
          doctorId: json.doctorId,
          isBooked: false,
        },
      });
      await trx.slot.createMany({
        data: slots,
      });
      logger.info({ message: "Slots generated successfully!" });
    });
  } catch (err) {
    logger.error({
      message: "Error generating slots",
      error: (err as Error).message,
    });
  }
});

export const publisherClient = new Redis(process.env.REDIS_HOST as string);
