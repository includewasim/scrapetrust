import "dotenv/config";

const BD_BASE = "https://api.brightdata.com";
const token = process.env.BRIGHT_DATA_API_TOKEN!;
const bdCollectorId = "c_mszlws7j2aico0ee7j";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("Triggering heal...");
  const res = await fetch(BD_BASE + "/dca/collectors/" + bdCollectorId + "/refactor_template", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "Price field stopped extracting correctly, please verify and fix if needed",
    }),
  });
  const trigger = await res.json();
  console.log("Trigger response:", JSON.stringify(trigger));

  console.log("Polling /refactor_template/progress ...");
  for (let i = 0; i < 20; i++) {
    const r = await fetch(
      BD_BASE + "/dca/collectors/" + bdCollectorId + "/refactor_template/progress",
      { headers: { Authorization: "Bearer " + token } }
    );
    const text = await r.text();
    console.log("attempt", i + 1, "status", r.status, "body:", text.slice(0, 400));

    try {
      const data = JSON.parse(text);
      if (data.status === "pending_answer" || data.status === "done" || data.status === "failed") {
        console.log("REACHED TERMINAL/GATE STATE:", data.status);
        console.log("Full payload:", JSON.stringify(data, null, 2));
        break;
      }
    } catch {}

    await sleep(3000);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
