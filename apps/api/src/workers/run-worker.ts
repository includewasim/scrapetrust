import { Worker } from "bullmq";
import { redisConnection } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";
import { triggerCollector, pollDataset, extractRows } from "../lib/bright-data.js";
import { computeNullRates, computeBaseline, detectDrift } from "../lib/drift-detector.js";
import { healQueue } from "../lib/queues.js";

export const runWorker = new Worker(
  "collector-run",
  async (job) => {
    const { collectorId } = job.data as { collectorId: string };
    console.log("[run-worker] starting job", job.id, "for collector", collectorId);

    const collector = await prisma.collector.findUniqueOrThrow({ where: { id: collectorId } });
    console.log("[run-worker] triggering Bright Data collector", collector.bdCollectorId);

    const triggerResponse = await triggerCollector(collector.bdCollectorId, [collector.sourceUrl]);
    console.log("[run-worker] trigger response:", JSON.stringify(triggerResponse));

    const collectionId = (triggerResponse as any).collection_id;
    if (!collectionId) {
      throw new Error(`No collection_id in trigger response: ${JSON.stringify(triggerResponse)}`);
    }

    console.log("[run-worker] polling dataset", collectionId);
    const rawData = await pollDataset(collectionId);
    console.log("[run-worker] got raw data, entries:", rawData.length);

    const rows = extractRows(rawData);
    console.log("[run-worker] extracted rows:", rows.length);

    const fields = Object.keys(collector.fieldSpec as Record<string, string>);
    const fieldNullRates = computeNullRates(rows, fields);
    const rowCount = rows.length;

    const priorRuns = await prisma.run.findMany({
      where: { collectorId, driftSeverity: "none" },
      orderBy: { runAt: "desc" },
      take: 7,
    });
    const baseline = computeBaseline(priorRuns);
    const drift = detectDrift({ rowCount, fieldNullRates }, baseline);
    console.log("[run-worker] drift result:", drift.severity, drift.reasons);

    const run = await prisma.run.create({
      data: {
        collectorId,
        rowCount,
        fieldNullRates,
        driftSeverity: drift.severity,
        driftReasons: drift.reasons,
        listings: {
          create: rows.map((r: any) => ({
            productId: r.productId,
            productName: r.productName,
            price: r.price?.value ?? null,
            currency: r.price?.currency ?? r.currency ?? null,
            inStock: r.inStock ?? null,
            sourceUrl: collector.sourceUrl,
            scrapedAt: new Date(),
          })),
        },
      },
    });
    console.log("[run-worker] saved run", run.id, "with", rowCount, "listings");

    if (drift.severity === "high" || drift.severity === "critical") {
      await healQueue.add("review-heal", { collectorId, runId: run.id });
      console.log("[run-worker] enqueued heal review");
    }

    return { runId: run.id, drift: drift.severity };
  },
  { connection: redisConnection }
);

runWorker.on("failed", (job, err) => {
  console.error("[run-worker] JOB FAILED:", job?.id, err.message);
});
runWorker.on("completed", (job) => {
  console.log("[run-worker] JOB COMPLETED:", job.id);
});
