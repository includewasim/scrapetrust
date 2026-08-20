interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: "green" | "red" | "amber" | "blue";
}

const colors = {
  green: "border-emerald-500/30 bg-emerald-500/5",
  red: "border-red-500/30 bg-red-500/5",
  amber: "border-amber-500/30 bg-amber-500/5",
  blue: "border-blue-500/30 bg-blue-500/5",
};

const valueColors = {
  green: "text-emerald-400",
  red: "text-red-400",
  amber: "text-amber-400",
  blue: "text-blue-400",
};

export default function StatCard({ label, value, sub, color = "blue" }: StatCardProps) {
  return (
    <div className={"rounded-xl border p-5 " + colors[color]}>
      <p className="text-sm text-neutral-400 mb-1">{label}</p>
      <p className={"text-3xl font-semibold tracking-tight " + valueColors[color]}>{value}</p>
      {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
    </div>
  );
}
