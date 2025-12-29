import { NextFunction, Request, Response } from "express";
import { INTERACTION_ID } from "../utils/constants";
import { getInteractionId, interactionStorage } from "../utils/logger";

const { v4: uuidv4, validate: uuidValidate } = require("uuid");

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
