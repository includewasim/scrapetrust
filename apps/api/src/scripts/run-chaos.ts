import "dotenv/config";
import { prisma } from "../lib/prisma.js";
import { triggerHeal, pollHealProgress, resumeAutomationJob, extractRows } from "../lib/bright-data.js";
import { reviewHeal } from "../lib/risk-gate.js";
import { normalizeListings, flattenRawRows } from "../lib/normalize-sample.js";
import { chaosScenarios } from "../chaos/scenarios.js";

const COLLECTOR_ID = "cmszmspz400003s7hh64ctvfp";
const BD_COLLECTOR_ID = "c_mszlws7j2aico0ee7j";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const results: { id: string; expected: string; actual: string; correct: boolean }[] = [];

  for (const scenario of chaosScenarios) {
    console.log("\n=== Scenario:", scenario.id, "===");
    console.log("Expected:", scenario.expectedVerdict);

    try {
      const trigger = await triggerHeal(BD_COLLECTOR_ID, scenario.healPrompt);
      console.log("Triggered:", JSON.stringify(trigger));

      const progress = await pollHealProgress(BD_COLLECTOR_ID);
      console.log("Progress status:", progress.status);

      if (progress.status !== "pending_answer") {
        console.log("No diff produced, skipping scenario");
        await resumeAutomationJob(BD_COLLECTOR_ID, false).catch(() => {});
        continue;
      }

      const oldParserCode = progress.diff?.template_a?.steps?.[0]?.parser?.parse_code ?? "";
      const newParserCode = progress.diff?.template_b?.steps?.[0]?.parser?.parse_code ?? "";
      const previewRaw = progress.preview_result ?? [];
      const rawSampleAfter = extractRows(previewRaw).slice(0, 5);
      const sampleAfter = flattenRawRows(rawSampleAfter);

      const lastGoodRun = await prisma.run.findFirst({
        where: { collectorId: COLLECTOR_ID, driftSeverity: "none" },
        orderBy: { runAt: "desc" },
        include: { listings: { take: 5 } },
      });
      const sampleBefore = lastGoodRun ? normalizeListings(lastGoodRun.listings) : [];

      const healEventInput = {
        fieldDescription: scenario.description,
        oldParserCode,
        newParserCode,
        sampleBefore,
        sampleAfter,
        rowCountBefore: lastGoodRun?.rowCount ?? 0,
        rowCountAfter: sampleAfter.length,
      };

      const verdict = await reviewHeal(healEventInput as any);
      console.log("Gate verdict:", verdict.verdict, "-", verdict.reasoning);

      await resumeAutomationJob(BD_COLLECTOR_ID, false);

      const correct = verdict.verdict === scenario.expectedVerdict;
      console.log(correct ? "CORRECT" : "INCORRECT");

      await prisma.healEvent.create({
        data: {
          collectorId: COLLECTOR_ID,
          fieldName: scenario.id,
          fieldDescription: scenario.description,
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
          wasChaosInjection: true,
          expectedVerdict: scenario.expectedVerdict,
          correct,
        },
      });

      results.push({ id: scenario.id, expected: scenario.expectedVerdict, actual: verdict.verdict, correct });
    } catch (e: any) {
      console.error("Scenario failed:", e.message);
      await resumeAutomationJob(BD_COLLECTOR_ID, false).catch(() => {});
    }

    console.log("Waiting before next scenario...");
    await sleep(5000);
  }

  console.log("\n=== SUMMARY ===");
  for (const r of results) {
    console.log(r.id, "| expected:", r.expected, "| actual:", r.actual, "|", r.correct ? "CORRECT" : "WRONG");
  }
  const correctCount = results.filter((r) => r.correct).length;
  console.log("\nAccuracy:", correctCount + "/" + results.length);

  process.exit(0);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
