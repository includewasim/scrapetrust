import type { RunStats, DriftResult } from "@scrapetrust/schema";

export function computeNullRates(rows: any[], fields: string[]): Record<string, number> {
  const rates: Record<string, number> = {};
  for (const field of fields) {
    const nullCount = rows.filter(
      (r) => r[field] === null || r[field] === undefined || r[field] === ""
    ).length;
    rates[field] = rows.length === 0 ? 1 : nullCount / rows.length;
  }
  return rates;
}

export function computeBaseline(
  priorRuns: { rowCount: number; fieldNullRates: any }[]
): RunStats {
  if (priorRuns.length === 0) return { rowCount: 1, fieldNullRates: {} };

  const rowCounts = priorRuns.map((r) => r.rowCount).sort((a, b) => a - b);
  const medianRowCount = rowCounts[Math.floor(rowCounts.length / 2)];

  const allFields = new Set<string>();
  priorRuns.forEach((r) => Object.keys(r.fieldNullRates as object).forEach((f) => allFields.add(f)));

  const fieldNullRates: Record<string, number> = {};
  for (const field of allFields) {
    const vals = priorRuns.map((r) => (r.fieldNullRates as any)[field] ?? 0).sort((a, b) => a - b);
    fieldNullRates[field] = vals[Math.floor(vals.length / 2)];
  }

  return { rowCount: medianRowCount, fieldNullRates };
}

export function detectDrift(current: RunStats, baseline: RunStats): DriftResult {
  const reasons: string[] = [];
  let severity: DriftResult["severity"] = "none";

  if (current.rowCount === 0) {
    return { severity: "critical", reasons: ["Extraction returned zero rows"] };
  }

  const rowDropPct = baseline.rowCount > 0 ? 1 - current.rowCount / baseline.rowCount : 0;
  if (rowDropPct > 0.5) {
    severity = "high";
    reasons.push(`Row count dropped ${(rowDropPct * 100).toFixed(0)}% vs baseline`);
  }

  for (const [field, rate] of Object.entries(current.fieldNullRates)) {
    const baseRate = baseline.fieldNullRates[field] ?? 0;
    const delta = rate - baseRate;
    if (delta > 0.4) {
      severity = "high";
      reasons.push(`Field "${field}" null rate jumped ${(delta * 100).toFixed(0)}pp`);
    } else if (delta > 0.15 && severity === "none") {
      severity = "medium";
      reasons.push(`Field "${field}" null rate rose ${(delta * 100).toFixed(0)}pp`);
    }
  }

  return { severity, reasons };
}
