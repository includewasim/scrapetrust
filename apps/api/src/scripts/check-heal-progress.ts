import "dotenv/config";

const BD_BASE = "https://api.brightdata.com";
const token = process.env.BRIGHT_DATA_API_TOKEN!;
const bdCollectorId = "c_mszlws7j2aico0ee7j";

async function main() {
  const r = await fetch(
    BD_BASE + "/dca/collectors/" + bdCollectorId + "/refactor_template/progress",
    { headers: { Authorization: "Bearer " + token } }
  );
  console.log("Status:", r.status);
  const text = await r.text();
  console.log("Body:", text);
  process.exit(0);
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
