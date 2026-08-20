const BD_BASE = "https://api.brightdata.com";
const token = process.env.BRIGHT_DATA_API_TOKEN!;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function triggerCollector(bdCollectorId: string, urls: string[]) {
  const res = await fetch(
    BD_BASE + "/dca/trigger?collector=" + bdCollectorId + "&queue_next=1",
    {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(urls.map((url) => ({ url }))),
    }
  );
  if (!res.ok) throw new Error("trigger failed: " + res.status + " " + (await res.text()));
  return res.json() as Promise<{ collection_id: string }>;
}

export async function pollDataset(
  collectionId: string,
  options: { intervalMs?: number; maxAttempts?: number } = {}
) {
  const intervalMs = options.intervalMs ?? 3000;
  const maxAttempts = options.maxAttempts ?? 40;
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(BD_BASE + "/dca/dataset?id=" + collectionId, {
      headers: { Authorization: "Bearer " + token },
    });
    if (res.status === 200) {
      const data = await res.json();
      return Array.isArray(data) ? data : [data];
    }
    await sleep(intervalMs);
  }
  throw new Error("pollDataset timed out");
}

// Filters out non-object placeholder strings like "18 more items" that
// Bright Data's preview_result uses to summarize truncated arrays.
export function extractRows(rawData: any[]): any[] {
  return rawData.flatMap((entry) => entry.products || []).filter(
    (item) => item !== null && typeof item === "object"
  );
}

export async function triggerHeal(bdCollectorId: string, prompt: string) {
  const res = await fetch(BD_BASE + "/dca/collectors/" + bdCollectorId + "/refactor_template", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error("heal trigger failed: " + res.status + " " + (await res.text()));
  return res.json() as Promise<{ id: string; queued: boolean }>;
}

export async function pollHealProgress(
  bdCollectorId: string,
  options: { intervalMs?: number; maxAttempts?: number } = {}
) {
  const intervalMs = options.intervalMs ?? 3000;
  const maxAttempts = options.maxAttempts ?? 60;
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(
      BD_BASE + "/dca/collectors/" + bdCollectorId + "/refactor_template/progress",
      { headers: { Authorization: "Bearer " + token } }
    );
    const data = await res.json();
    if (data.status === "pending_answer" || data.status === "done" || data.status === "failed") {
      return data;
    }
    await sleep(intervalMs);
  }
  throw new Error("pollHealProgress timed out");
}

export async function resumeAutomationJob(bdCollectorId: string, approve: boolean) {
  const res = await fetch(
    BD_BASE + "/dca/collectors/" + bdCollectorId + "/resume_automation_job",
    {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ message: approve, auto_save: approve }),
    }
  );
  if (!res.ok) throw new Error("resume failed: " + res.status + " " + (await res.text()));
  return res.json();
}
