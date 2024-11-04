import { z } from "zod";

export const userSchema = z.object({
  user: z.object({
    name: z.string(),
    phone: z.string().min(10).max(10),
    password: z.string(),
    age: z.number(),
    gender: z
      .string()
      .refine((gender: string) => ["M", "F"].includes(gender.toUpperCase()), {
        message: "Invalid gender, allowed values [M, F]",
      }),
  }),
});
