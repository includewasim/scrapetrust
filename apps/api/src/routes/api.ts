import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

export async function apiRoutes(app: FastifyInstance) {

  // Overview stats for the dashboard header
  app.get("/api/stats", async () => {
    const totalRuns = await prisma.run.count();
    const totalListings = await prisma.listing.count();
    const totalHealEvents = await prisma.healEvent.count();
    const collectors = await prisma.collector.count();
    const driftEvents = await prisma.run.count({
      where: { driftSeverity: { not: "none" } },
    });
    const chaosResults = await prisma.healEvent.findMany({
      where: { wasChaosInjection: true },
    });
    const chaosTotal = chaosResults.length;
    const chaosCorrect = chaosResults.filter((r) => r.correct === true).length;

    return {
      totalRuns,
      totalListings,
      totalHealEvents,
      collectors,
      driftEvents,
      chaosTotal,
      chaosCorrect,
      chaosAccuracy: chaosTotal > 0 ? Math.round((chaosCorrect / chaosTotal) * 100) : null,
    };
  });

  // All collectors with their latest run status
  app.get("/api/collectors", async () => {
    const collectors = await prisma.collector.findMany({
      include: {
        runs: {
          orderBy: { runAt: "desc" },
          take: 1,
        },
        healEvents: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    return collectors.map((c) => ({
      id: c.id,
      name: c.name,
      sourceUrl: c.sourceUrl,
      platform: c.platform,
      lastRun: c.runs[0] ?? null,
      lastHeal: c.healEvents[0] ?? null,
    }));
  });

  // Run history for a specific collector
  app.get("/api/collectors/:id/runs", async (req) => {
    const { id } = req.params as { id: string };
    const runs = await prisma.run.findMany({
      where: { collectorId: id },
      orderBy: { runAt: "desc" },
      take: 50,
    });
    return runs;
  });

  // Listings for a specific run
  app.get("/api/runs/:id/listings", async (req) => {
    const { id } = req.params as { id: string };
    const listings = await prisma.listing.findMany({
      where: { runId: id },
    });
    return listings;
  });

  // All heal events, newest first
  app.get("/api/heal-events", async () => {
    const events = await prisma.healEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { collector: { select: { name: true } } },
    });
    return events;
  });

  // Single heal event with full detail (for diff-replay view)
  app.get("/api/heal-events/:id", async (req) => {
    const { id } = req.params as { id: string };
    const event = await prisma.healEvent.findUniqueOrThrow({
      where: { id },
      include: { collector: { select: { name: true } } },
    });
    return event;
  });

  // Chaos injection results only
  app.get("/api/chaos-results", async () => {
    const results = await prisma.healEvent.findMany({
      where: { wasChaosInjection: true },
      orderBy: { createdAt: "desc" },
    });
    return results;
  });
}
