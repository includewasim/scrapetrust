import "dotenv/config";
import { prisma } from "../lib/prisma.js";

async function main() {
  const runs = await prisma.run.findMany({ include: { listings: true } });
  console.log("Runs:", runs.length);
  if (runs[0]) {
    console.log("First run:", runs[0].driftSeverity, runs[0].rowCount, "listings:", runs[0].listings.length);
    console.log("Sample listing:", runs[0].listings[0]);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
