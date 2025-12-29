import { createLogger, format, transports } from "winston";
import { AsyncLocalStorage } from "async_hooks";

export const interactionStorage = new AsyncLocalStorage<{
  interactionId: string;
}>();

export const getInteractionId = () => {
  return interactionStorage.getStore()?.interactionId;
};

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.json(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const interactionId = getInteractionId();
      return JSON.stringify({
        timestamp,
        level,
        message,
        interactionId,
        ...meta,
      });
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "app.log" }),
  ],
});

export default logger;
