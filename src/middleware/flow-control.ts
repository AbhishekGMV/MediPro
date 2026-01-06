import { NextFunction, Request, Response } from "express";
import { INTERACTION_ID } from "../utils/constants.js";
import { interactionStorage } from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";

export default function assignInteractionId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let interactionId = req.headers[INTERACTION_ID] || uuidv4();
  interactionStorage.run({ interactionId: interactionId.toString() }, () => {
    req.headers[INTERACTION_ID] = interactionId.toString();
    next();
  });
}
