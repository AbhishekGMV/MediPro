import { registerOTel } from "@vercel/otel";

export async function register() {
  await import("./src/utils/worker");
}
