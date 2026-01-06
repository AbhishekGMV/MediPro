import { z } from "zod";
import { userSchema } from "./user";

export const doctorRegisterSchema = z.object({
  file: z
    .any()
    .refine((file) => file !== undefined, `File is required`)
    .optional(),
  body: z.object({
    user: userSchema.extend({
      specialization: z.string(),
    }),
  }),
});

export const doctorLoginSchema = z.object({
  user: z.object({
    phone: z.string(),
    password: z.string(),
  }),
});

export const doctorSignatureFileUpdateSchema = z.object({
  file: z.any().refine((file) => file !== undefined, `File is required`),
  params: z.object({
    id: z.string(),
  }),
});

export const DoctorLeaveSchema = z.object({
  body: z.object({
    date: z.string().date(),
  }),
});

const DoctorSlotSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  dayOfWeek: z.number(),
});

export const DoctorAvailabilitySchema = z.object({
  body: z.object({
    weeklyAvailability: z.array(DoctorSlotSchema).transform((arr) =>
      arr.map((val) => ({
        startTime: new Date(val.startTime),
        endTime: new Date(val.endTime),
        dayOfweek: Number(val.dayOfWeek),
      }))
    ),
    interval: z
      .number()
      .int()
      .positive()
      .refine((value) => [15, 30].includes(value), {
        message: "Interval must be either 15 or 30 minutes",
      }),
  }),
});
