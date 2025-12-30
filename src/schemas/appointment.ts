import { z } from "zod";

export const AppointmentSchema = z.object({
  body: z.object({
    doctorId: z.string(),
    startTime: z.string().datetime({ offset: true }).optional(),
    endTime: z.string().datetime({ offset: true }).optional(),
  }),
});
