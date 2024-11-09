import { z } from "zod";

export const userSchema = z.object({
  name: z.string(),
  phone: z.string().min(10).max(10),
  password: z.string(),
  age: z.number().optional(),
  gender: z
    .string()
    .refine(
      (gender: string) =>
        ["male", "female", "others"].includes(gender.toLowerCase()),
      {
        message: "Invalid gender, required male, female or others",
      }
    )
    .transform((gender) => gender.toLowerCase()),
});
