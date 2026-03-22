"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "../../components/ui/card";

type ReportRow = {
  _id: string;
  filePath: string;
  generatedAt: string;
  species: string;
  alertId?: string;
  reportUrl?: string;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reports", { cache: "no-store" });
        const data = (await res.json()) as { reports?: ReportRow[]; error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? `Failed to load reports (${res.status})`);
          return;
        }
        setReports(data.reports ?? []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load reports");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ranger-text">Reports</h1>
        <Link href="/" className="text-sm text-ranger-moss hover:underline">
          Back to dashboard
        </Link>
      </div>

      <Card className="p-5">
        {loading ? (
          <p className="text-sm text-ranger-muted">Loading reports...</p>
        ) : error ? (
          <p className="text-sm text-ranger-apricot">{error}</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-ranger-muted">No reports generated yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ranger-border text-left text-xs uppercase text-ranger-muted">
                  <th className="pb-3 pr-4">Species</th>
                  <th className="pb-3 pr-4">Generated</th>
                  <th className="pb-3 pr-4">Alert</th>
                  <th className="pb-3">Access</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r._id} className="border-b border-ranger-border/50 last:border-0">
                    <td className="py-3 pr-4 text-sm text-ranger-text">{r.species}</td>
                    <td className="py-3 pr-4 text-sm text-ranger-muted">
                      {new Date(r.generatedAt).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-sm text-ranger-muted">{r.alertId ?? "-"}</td>
                    <td className="py-3 text-sm">
                      {r.reportUrl ? (
                        <a
                          href={r.reportUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-ranger-moss hover:underline"
                        >
                          Open report
                        </a>
                      ) : (
                        <code className="text-xs text-ranger-muted">{r.filePath}</code>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </main>
  );
}
