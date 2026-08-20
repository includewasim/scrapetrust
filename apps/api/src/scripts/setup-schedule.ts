import "dotenv/config";
import { collectorRunQueue } from "../lib/queues.js";
import { prisma } from "../lib/prisma.js";

async function main() {
  const collectors = await prisma.collector.findMany();

  for (const collector of collectors) {
    await collectorRunQueue.add(
      "scheduled-run",
      { collectorId: collector.id },
      {
        repeat: {
          every: 1000 * 60 * 60,  // every 1 hour
        },
        jobId: "repeat-" + collector.id,
      }
    );
    console.log("Scheduled hourly run for:", collector.name, collector.id);
  }

  console.log("All schedules set. You can close this script.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
