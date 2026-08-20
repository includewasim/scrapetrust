import { z } from "zod";

export const listingSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  price: z.number().nullable(),
  currency: z.string().nullable(),
  inStock: z.boolean().nullable(),
  sourceUrl: z.string().url(),
  sourcePlatform: z.string(),
  scrapedAt: z.string().datetime(),
});
export type Listing = z.infer<typeof listingSchema>;

export const runStatsSchema = z.object({
  rowCount: z.number(),
  fieldNullRates: z.record(z.string(), z.number()),
});
export type RunStats = z.infer<typeof runStatsSchema>;

export const driftSeverity = z.enum(["none", "medium", "high", "critical"]);
export type DriftSeverity = z.infer<typeof driftSeverity>;

export const driftResultSchema = z.object({
  severity: driftSeverity,
  reasons: z.array(z.string()),
});
export type DriftResult = z.infer<typeof driftResultSchema>;

export const healVerdict = z.enum(["safe_to_promote", "needs_review", "reject"]);
export type HealVerdict = z.infer<typeof healVerdict>;

// Real shape confirmed against Bright Data's actual refactor_template/progress
// response: no "selectors", it's a full parser-code diff plus a live preview
// of the new code's output.
export const healEventSchema = z.object({
  fieldDescription: z.string(),
  oldParserCode: z.string(),
  newParserCode: z.string(),
  sampleBefore: z.array(z.record(z.string(), z.any())), // last known-good listings from our own DB
  sampleAfter: z.array(z.record(z.string(), z.any())),  // preview_result from Bright Data
  rowCountBefore: z.number(),
  rowCountAfter: z.number(),
});
export type HealEvent = z.infer<typeof healEventSchema>;

export const riskGateVerdictSchema = z.object({
  risk_level: z.enum(["low", "medium", "high"]),
  verdict: healVerdict,
  reasoning: z.string(),
  semantic_drift_detected: z.boolean(),
  confidence: z.number().min(0).max(1),
});
export type RiskGateVerdict = z.infer<typeof riskGateVerdictSchema>;

export const chaosInjectionSchema = z.object({
  injectionType: z.string(),
  fieldTargeted: z.string(),
  expectedVerdict: healVerdict,
  actualVerdict: healVerdict.nullable(),
  correct: z.boolean().nullable(),
});
export type ChaosInjection = z.infer<typeof chaosInjectionSchema>;
