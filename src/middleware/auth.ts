// auth middleware
import { type Request, type Response, type NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Status } from "../utils/status";
import logger from "../utils/logger";

export const auth = (
  req: Request,
  res: Response,
  next: NextFunction
): Response<void> | undefined => {
  const authHeader = req.header("Authorization");
  const token = authHeader?.split(" ")[1];
  if (token == null) {
    return res
      .status(401)
      .json({ status: Status.ERROR, message: "Unauthorized access" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "");
    const { id } = decoded as JwtPayload;
    (req as any).user = { id };

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ status: Status.ERROR, message: "Unauthorized access" });
  }
};
