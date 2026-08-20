import { Queue } from "bullmq";
import { redisConnection } from "./redis.js";

export const collectorRunQueue = new Queue("collector-run", { connection: redisConnection });
export const healQueue = new Queue("heal-review", { connection: redisConnection });
