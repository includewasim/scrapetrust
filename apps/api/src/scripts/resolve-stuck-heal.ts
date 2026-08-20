import "dotenv/config";

const BD_BASE = "https://api.brightdata.com";
const token = process.env.BRIGHT_DATA_API_TOKEN!;
const bdCollectorId = "c_mszlws7j2aico0ee7j";
const jobId = "ia_mszngv8q13mk2yfzx0";

async function main() {
  const res = await fetch(
    BD_BASE + "/dca/collectors/" + bdCollectorId + "/resume_automation_job",
    {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ id: jobId, message: false, auto_save: false }),
    }
  );
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body:", text);
  process.exit(0);
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
