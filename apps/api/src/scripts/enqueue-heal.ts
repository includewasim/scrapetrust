import "dotenv/config";
import { healQueue } from "../lib/queues.js";
import { prisma } from "../lib/prisma.js";

async function main() {
  const collector = await prisma.collector.findFirstOrThrow({
    where: { bdCollectorId: "c_mszlws7j2aico0ee7j" },
  });

  const job = await healQueue.add("review-heal", {
    collectorId: collector.id,
    runId: "manual-test",
  });

  console.log("Enqueued heal job:", job.id, "for collector:", collector.id);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
