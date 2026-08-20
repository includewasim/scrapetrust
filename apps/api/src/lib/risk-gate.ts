import OpenAI from "openai";
import type { HealEvent, RiskGateVerdict } from "@scrapetrust/schema";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"] as const;

const SYSTEM_PROMPT = `You are a data-reliability reviewer for an automated web-scraper
self-healing system. A scraper broke and Bright Data's AI proposed a fix: new parser
code plus a small PREVIEW SAMPLE of what that new code extracts.

IMPORTANT: sampleAfter is a truncated preview, capped at a few example rows by the
platform itself, regardless of how many rows the real run would produce. A small
sampleAfter length is NORMAL and is NOT evidence of data loss. Do not compare
rowCountBefore to the number of items in sampleAfter — that comparison is meaningless.
Judge ONLY the actual field values present in sampleAfter against sampleBefore and
against fieldDescription.

You will be given:
- fieldDescription: what the field is supposed to mean
- oldParserCode / newParserCode: the actual code before and after the proposed fix
- sampleBefore: real recent data this collector produced when it was last working
- sampleAfter: a few preview example rows produced by the new code (may be short, ignore length)

Watch for:
- A "price" field now capturing a different concept entirely (e.g. a rating, a fee,
  a different field) even if the code runs without error and produces plausible-looking values
- A field that is structurally valid (right data type) but semantically wrong
- Fields present in sampleBefore that are missing entirely from sampleAfter's objects
  (not missing rows — missing fields within the rows that ARE shown)
- No values recovered at all in the rows shown — this is always a rejection

Respond with ONLY valid JSON, no other text:
{
  "risk_level": "low" | "medium" | "high",
  "verdict": "safe_to_promote" | "needs_review" | "reject",
  "reasoning": "1-2 sentences, specific, referencing actual values or code from the input",
  "semantic_drift_detected": boolean,
  "confidence": number
}`;

export async function reviewHeal(event: HealEvent): Promise<RiskGateVerdict> {
  for (const model of MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(event, null, 2) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });
      const raw = completion.choices[0]?.message?.content ?? "{}";
      return JSON.parse(raw) as RiskGateVerdict;
    } catch (err: any) {
      if (err?.status === 429 && model !== MODELS[MODELS.length - 1]) continue;
      throw err;
    }
  }
  throw new Error("All Groq models exhausted");
}
