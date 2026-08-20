interface HealEventProps {
  event: {
    id: string;
    fieldName: string;
    verdict: string;
    riskLevel: string;
    reasoning: string;
    confidence: number;
    wasChaosInjection: boolean;
    expectedVerdict?: string | null;
    correct?: boolean | null;
    createdAt: string;
    collector?: { name: string } | null;
  };
}

const verdictStyles: Record<string, { bg: string; text: string; label: string }> = {
  safe_to_promote: { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400", label: "Approved" },
  needs_review: { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400", label: "Needs Review" },
  reject: { bg: "bg-red-500/10 border-red-500/30", text: "text-red-400", label: "Rejected" },
};

export default function HealEventCard({ event }: HealEventProps) {
  const style = verdictStyles[event.verdict] || verdictStyles.needs_review;
  const time = new Date(event.createdAt).toLocaleString();

  return (
    <div className={"rounded-xl border p-5 mb-3 " + style.bg}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className={"text-sm font-semibold px-2.5 py-0.5 rounded-full border " + style.bg + " " + style.text}>
            {style.label}
          </span>
          {event.wasChaosInjection && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400">
              Chaos Test
            </span>
          )}
          {event.wasChaosInjection && event.correct !== null && (
            <span className={event.correct ? "text-xs text-emerald-400" : "text-xs text-red-400"}>
              {event.correct ? "Gate Correct" : "Gate Incorrect"}
            </span>
          )}
        </div>
        <span className="text-xs text-neutral-500">{time}</span>
      </div>
      <p className="text-sm text-neutral-300 mb-1">
        <span className="text-neutral-500">Collector:</span> {event.collector?.name || "Unknown"}
        <span className="text-neutral-600 mx-2">|</span>
        <span className="text-neutral-500">Field:</span> {event.fieldName}
        <span className="text-neutral-600 mx-2">|</span>
        <span className="text-neutral-500">Confidence:</span> {Math.round(event.confidence * 100)}%
      </p>
      <p className="text-sm text-neutral-400 mt-2 leading-relaxed">{event.reasoning}</p>
    </div>
  );
}
