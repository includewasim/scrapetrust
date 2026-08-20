import "dotenv/config";
import IORedis from "ioredis";

const conn = new IORedis(process.env.REDIS_URL!);

conn.on("connect", () => {
  console.log("REDIS CONNECTED");
  process.exit(0);
});

conn.on("error", (e) => {
  console.error("REDIS ERROR:", e.message);
  process.exit(1);
});

setTimeout(() => {
  console.error("REDIS TIMEOUT — never connected");
  process.exit(1);
}, 8000);
