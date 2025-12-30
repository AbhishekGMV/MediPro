import { z } from "zod";
import { userSchema } from "./user";

export const patientRegisterSchema = z.object({
  body: z.object({
    user: userSchema,
  }),
});

export const patientLoginSchema = z.object({
  user: z.object({
    phone: z.string(),
    password: z.string(),
  }),
});
