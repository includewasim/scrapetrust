interface Run {
  id: string;
  rowCount: number;
  driftSeverity: string;
  driftReasons: string[];
  runAt: string;
}

const severityDot: Record<string, string> = {
  none: "bg-emerald-400",
  medium: "bg-amber-400",
  high: "bg-red-400",
  critical: "bg-red-600 animate-pulse",
};

export default function RunTimeline({ runs }: { runs: Run[] }) {
  if (runs.length === 0) {
    return <p className="text-neutral-500 text-sm">No runs yet.</p>;
  }

  return (
    <div className="space-y-2">
      {runs.slice(0, 20).map((run) => {
        const time = new Date(run.runAt).toLocaleString();
        const dot = severityDot[run.driftSeverity] || severityDot.none;
        return (
          <div key={run.id} className="flex items-center gap-3 py-2 px-4 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <div className={"w-2.5 h-2.5 rounded-full flex-shrink-0 " + dot} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-300">{run.rowCount} rows</span>
                <span className="text-xs text-neutral-500">{time}</span>
              </div>
              {run.driftSeverity !== "none" && (
                <p className="text-xs text-amber-400/80 mt-0.5 truncate">
                  {(run.driftReasons as string[]).join("; ")}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
