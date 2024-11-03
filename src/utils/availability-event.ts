import EventEmitter from "events";
import logger from "./logger";
import { generateSlots } from "./helper";
import prisma from "../config/prisma";

class AvailabilityEvent extends EventEmitter {
  private retryCount: number;
  private static instance: AvailabilityEvent | null = null;

  constructor() {
    super();
    this.retryCount = 0;
    this.setMaxListeners(3);
    this.on("slot", this.updateAvailability);
    // on error retry
    this.on("error", this.updateAvailability);
  }

  public static getInstance(): AvailabilityEvent {
    if (!AvailabilityEvent.instance) {
      AvailabilityEvent.instance = new AvailabilityEvent();
    }
    return AvailabilityEvent.instance;
  }

  async updateAvailability(json: any) {
    try {
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
          message: `Failed to generate slots, retrying(${this.retryCount})`,
          description: `${(err as Error).message}`,
        });
        return;
      }
      this.retryCount++;
      this.emit("error", json);

      logger.error({
        message: `Error generating slots, retrying(${this.retryCount})...`,
        error: (err as Error).message,
      });
    }
  }
}

export default AvailabilityEvent.getInstance();
