import "dotenv/config";

const BD_BASE = "https://api.brightdata.com";
const token = process.env.BRIGHT_DATA_API_TOKEN!;
const bdCollectorId = "c_mszlws7j2aico0ee7j";
const jobId = "ia_mszngv8q13mk2yfzx0";

const candidates = [
  { job_id: jobId, message: false, auto_save: false },
  { automation_job_id: jobId, message: false, auto_save: false },
  { automation_id: jobId, message: false, auto_save: false },
  { ia_id: jobId, message: false, auto_save: false },
  { message: false, auto_save: false }, // maybe id is in the URL, not body
];

async function main() {
  for (const body of candidates) {
    const res = await fetch(
      BD_BASE + "/dca/collectors/" + bdCollectorId + "/resume_automation_job",
      {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const text = await res.text();
    console.log("--- body:", JSON.stringify(body));
    console.log("status:", res.status, "response:", text.slice(0, 300));
    console.log();
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
