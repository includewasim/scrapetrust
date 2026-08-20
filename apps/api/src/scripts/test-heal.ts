import "dotenv/config";

const BD_BASE = "https://api.brightdata.com";
const token = process.env.BRIGHT_DATA_API_TOKEN!;
const bdCollectorId = "c_mszlws7j2aico0ee7j";

async function main() {
  console.log("Triggering heal...");
  const res = await fetch(BD_BASE + "/dca/collectors/" + bdCollectorId + "/refactor_template", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "Price field stopped extracting correctly, please verify and fix if needed",
    }),
  });

  console.log("Trigger status:", res.status);
  const text = await res.text();
  console.log("Trigger raw body:", text);

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    console.log("Could not parse as JSON, stopping here.");
    process.exit(1);
  }

  const jobId = data.job_id || data.id || data.jobId;
  if (!jobId) {
    console.log("No obvious job id field in response. Full keys:", Object.keys(data));
    process.exit(1);
  }
  console.log("Using job id:", jobId);

  // Try a few plausible polling endpoints, log all of them
  const candidates = [
    "/dca/jobs/" + jobId,
    "/dca/collectors/" + bdCollectorId + "/jobs/" + jobId,
    "/dca/automation_jobs/" + jobId,
    "/dca/refactor_template/" + jobId,
  ];

  for (const path of candidates) {
    try {
      const r = await fetch(BD_BASE + path, { headers: { Authorization: "Bearer " + token } });
      const t = await r.text();
      console.log("--- GET", path, "status:", r.status);
      console.log(t.slice(0, 500));
    } catch (e: any) {
      console.log("--- GET", path, "threw:", e.message);
    }
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
