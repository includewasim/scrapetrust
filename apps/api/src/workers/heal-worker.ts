import { Worker } from "bullmq";
import { redisConnection } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";
import { triggerHeal, pollHealProgress, resumeAutomationJob, extractRows } from "../lib/bright-data.js";
import { reviewHeal } from "../lib/risk-gate.js";
import { normalizeListings, flattenRawRows } from "../lib/normalize-sample.js";

export const healWorker = new Worker(
  "heal-review",
  async (job) => {
    const { collectorId } = job.data as { collectorId: string; runId: string };
    console.log("[heal-worker] starting job", job.id, "for collector", collectorId);

    const collector = await prisma.collector.findUniqueOrThrow({ where: { id: collectorId } });
    const fieldSpec = collector.fieldSpec as Record<string, string>;
    const fieldDescriptions = Object.entries(fieldSpec)
      .map(([name, desc]) => name + ": " + desc)
      .join("; ");

    console.log("[heal-worker] triggering heal on", collector.bdCollectorId);
    const triggerResult = await triggerHeal(
      collector.bdCollectorId,
      "Extraction stopped working correctly. Fields: " + fieldDescriptions
    );
    console.log("[heal-worker] trigger result:", JSON.stringify(triggerResult));

    console.log("[heal-worker] polling refactor progress...");
    const progress = await pollHealProgress(collector.bdCollectorId);
    console.log("[heal-worker] progress status:", progress.status);

    if (progress.status !== "pending_answer") {
      console.log("[heal-worker] no diff to review, status was:", progress.status);
      return { verdict: "no_diff" };
    }

    const oldParserCode = progress.diff?.template_a?.steps?.[0]?.parser?.parse_code ?? "";
    const newParserCode = progress.diff?.template_b?.steps?.[0]?.parser?.parse_code ?? "";

    const previewRaw = progress.preview_result ?? [];
    const sampleAfter = flattenRawRows(extractRows(previewRaw).slice(0, 5));

    const lastGoodRun = await prisma.run.findFirst({
      where: { collectorId, driftSeverity: "none" },
      orderBy: { runAt: "desc" },
      include: { listings: { take: 5 } },
    });
    const sampleBefore = lastGoodRun ? normalizeListings(lastGoodRun.listings) : [];

    const healEventInput = {
      fieldDescription: fieldDescriptions,
      oldParserCode,
      newParserCode,
      sampleBefore,
      sampleAfter,
      rowCountBefore: lastGoodRun?.rowCount ?? 0,
      rowCountAfter: sampleAfter.length,
    };

    console.log("[heal-worker] calling risk gate...");
    const verdict = await reviewHeal(healEventInput as any);
    console.log("[heal-worker] verdict:", verdict.verdict, verdict.reasoning);

    const approve = verdict.verdict === "safe_to_promote";
    await resumeAutomationJob(collector.bdCollectorId, approve);
    console.log("[heal-worker] resumed automation job, approved:", approve);

    await prisma.healEvent.create({
      data: {
        collectorId,
        fieldName: Object.keys(fieldSpec)[0],
        fieldDescription: fieldDescriptions,
        oldSelector: oldParserCode.slice(0, 2000),
        newSelector: newParserCode.slice(0, 2000),
        sampleValuesBefore: sampleBefore as any,
        sampleValuesAfter: sampleAfter as any,
        rowCountBefore: healEventInput.rowCountBefore,
        rowCountAfter: healEventInput.rowCountAfter,
        riskLevel: verdict.risk_level,
        verdict: verdict.verdict,
        reasoning: verdict.reasoning,
        semanticDriftDetected: verdict.semantic_drift_detected,
        confidence: verdict.confidence,
      },
    });
    console.log("[heal-worker] saved heal event");

    return { verdict: verdict.verdict };
  },
  { connection: redisConnection }
);

healWorker.on("failed", (job, err) => {
  console.error("[heal-worker] JOB FAILED:", job ? job.id : "unknown", err.message);
});
healWorker.on("completed", (job) => {
  console.log("[heal-worker] JOB COMPLETED:", job.id);
});
