"use client";

import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import HealEventCard from "../components/HealEventCard";
import RunTimeline from "../components/RunTimeline";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function useAPI(path: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(API + path)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
    const interval = setInterval(() => {
      fetch(API + path)
        .then((r) => r.json())
        .then(setData)
        .catch(console.error);
    }, 15000);
    return () => clearInterval(interval);
  }, [path]);
  return { data, loading };
}

export default function Dashboard() {
  const { data: stats, loading: statsLoading } = useAPI("/api/stats");
  const { data: collectors } = useAPI("/api/collectors");
  const { data: healEvents } = useAPI("/api/heal-events");
  const { data: runs } = useAPI("/api/collectors/" + (collectors?.[0]?.id || "none") + "/runs");

  if (statsLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
          ScrapeTrust
        </h1>
        <p className="text-neutral-500">
          Self-healing scraper pipeline with AI trust verification
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Runs" value={stats?.totalRuns ?? 0} color="blue" />
        <StatCard label="Listings Collected" value={stats?.totalListings ?? 0} color="green" />
        <StatCard label="Heal Events" value={stats?.totalHealEvents ?? 0} color="amber" />
        <StatCard
          label="Trust Gate Accuracy"
          value={stats?.chaosAccuracy !== null ? stats.chaosAccuracy + "%" : "—"}
          sub={stats?.chaosTotal > 0 ? stats.chaosCorrect + "/" + stats.chaosTotal + " correct" : "No tests yet"}
          color={stats?.chaosAccuracy >= 75 ? "green" : stats?.chaosAccuracy >= 50 ? "amber" : "red"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Run History</h2>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <RunTimeline runs={runs || []} />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-4">
            Heal Events
            <span className="text-sm font-normal text-neutral-500 ml-2">
              Trust gate decisions
            </span>
          </h2>
          <div className="space-y-3">
            {healEvents && healEvents.length > 0 ? (
              healEvents.slice(0, 10).map((event: any) => (
                <HealEventCard key={event.id} event={event} />
              ))
            ) : (
              <p className="text-neutral-500 text-sm">No heal events yet.</p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white mb-4">Active Collectors</h2>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-neutral-500 text-left">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Platform</th>
                <th className="px-5 py-3 font-medium">Last Run</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {collectors && collectors.map((c: any) => {
                const lastRun = c.lastRun;
                const severity = lastRun?.driftSeverity || "none";
                const statusColor = severity === "none" ? "text-emerald-400" : severity === "medium" ? "text-amber-400" : "text-red-400";
                const statusLabel = severity === "none" ? "Healthy" : severity === "medium" ? "Drift detected" : "Broken";
                return (
                  <tr key={c.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-neutral-200">{c.name}</td>
                    <td className="px-5 py-3 text-neutral-400">{c.platform}</td>
                    <td className="px-5 py-3 text-neutral-400">
                      {lastRun ? new Date(lastRun.runAt).toLocaleString() : "Never"}
                    </td>
                    <td className={"px-5 py-3 font-medium " + statusColor}>{statusLabel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-16 pb-8 text-center text-xs text-neutral-600">
        Built for Into the Scrape-Verse — WeMakeDevs x Bright Data
      </footer>
    </main>
  );
}
