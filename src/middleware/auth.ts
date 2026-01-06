// auth middleware
import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Status } from "../utils/status.js";
import { UserRole } from "../utils/types.js";

export const auth = (
  req: Request,
  res: Response,
  next: NextFunction
): Response<void> | undefined => {
  const { token } = req.cookies;
  if (token == null) {
    return res
      .status(401)
      .json({ status: Status.ERROR, message: "Unauthorized access" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "");
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ status: Status.ERROR, message: "Unauthorized access" });
  }
};

export const role = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowedRoles.includes((req as any).user.role)) {
      return res
        .status(403)
        .json({ status: Status.ERROR, message: "Access denied" });
    }
    next();
  };
};
