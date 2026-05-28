import { Queue } from "bullmq";
import { redis } from "../config/redis";

export const extractionQueue = new Queue("extraction", {
  connection: redis,
});
