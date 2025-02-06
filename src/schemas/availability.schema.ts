import { z } from "zod";

export const SlotSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  dayOfWeek: z
    .string()
    .refine(
      (day) =>
        [
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
          "SATURDAY",
          "SUNDAY",
        ].includes(day.toUpperCase()),
      { message: "Invalid day of week" },
    ),
});

export const AvailabilitySchema = z.object({
  headers: z.object({
    id: z.string(),
  }),
  body: z.object({
    availabilities: z.array(SlotSchema).transform((arr) =>
      arr.map((val) => ({
        startTime: new Date(val.startTime),
        endTime: new Date(val.endTime),
      })),
    ),
    interval: z
      .number()
      .int()
      .positive()
      .refine((value) => [15, 30].includes(value), {
        message: "Interval must be either 15 or 30 minutes",
      }),
    weekStart: z.string(),
  }),
});
