import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { IssueTokenInput } from "../utils/types.js";

export async function issueAccessToken(
  input: IssueTokenInput,
  plainPassword: string
) {
  const isValid = await bcrypt.compare(plainPassword, input.passwordHash);

  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  const payload = {
    id: input.id,
    role: input.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET ?? "", {
    expiresIn: "1h",
  });
}
