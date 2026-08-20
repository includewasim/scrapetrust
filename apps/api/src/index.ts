import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { apiRoutes } from "./routes/api.js";
import "./workers/run-worker.js";
import "./workers/heal-worker.js";

const app = Fastify({ logger: true });

app.register(cors, { origin: true });
app.register(apiRoutes);

app.get("/health", async () => ({ status: "ok" }));

app.listen({ port: 3001, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
