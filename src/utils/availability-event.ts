import EventEmitter from "events";
import logger from "./logger";
import { generateSlots } from "./helper";
import prisma from "../config/prisma";

class AvailabilityEvent extends EventEmitter {
  retryCount: number;

  constructor() {
    super();
    this.retryCount = 0;
    this.setMaxListeners(3);
    this.on("slot", this.updateAvailability);
    // on error retry
    this.on("error", this.updateAvailability);
  }

  async updateAvailability(data: any) {
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
        this.retryCount = 0;
        logger.info({ message: "Slots generated successfully!" });
      });
    } catch (err) {
      if (this.retryCount === 3) {
        logger.error({
          message: "Failed to generate slots",
          description: `${(err as Error).message}`,
        });
        return;
      }
      this.retryCount++;
      this.emit("error", data);

      logger.error({
        message: `Error generating slots, retrying(${this.retryCount})...`,
        error: (err as Error).message,
      });
    }
  }
}

export default AvailabilityEvent;
