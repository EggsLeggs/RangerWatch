"use client";

import { useCallback, useState } from "react";

type LastReport = {
  reportId: string;
  reportUrl?: string;
  filePath: string;
  species: string;
};

type GenerateResponse = {
  ok: boolean;
  error?: string;
  reportId?: string;
  reportUrl?: string;
  filePath?: string;
  species?: string;
};

type ReportListItem = {
  _id: string;
  alertId?: string;
  reportUrl?: string;
  filePath: string;
  species: string;
};

export function useReportGenerator() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [lastReport, setLastReport] = useState<LastReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateReport = useCallback(async (alertId: string, species: string) => {
    setGenerating(alertId);
    setError(null);
    setLastReport(null);

    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });

      const payload = (await res.json()) as GenerateResponse;
      if (!res.ok || !payload.ok) {
        setError(payload.error ?? "Failed to generate report");
        setGenerating(null);
        return;
      }

      if (payload.reportId && payload.filePath) {
        setLastReport({
          reportId: payload.reportId,
          reportUrl: payload.reportUrl,
          filePath: payload.filePath,
          species: payload.species ?? species,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate report");
    } finally {
      setGenerating(null);
    }
  }, []);

  const openOrGenerate = useCallback(async (alertId: string, species: string) => {
    if (generating !== null) return;

    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = (await res.json()) as { reports: ReportListItem[] };
        const existing = data.reports.find((r) => r.alertId === alertId);
        if (existing) {
          setLastReport({
            reportId: existing._id,
            reportUrl: existing.reportUrl,
            filePath: existing.filePath,
            species: existing.species,
          });
          return;
        }
      }
    } catch {
      // fall through to generate
    }

    await generateReport(alertId, species);
  }, [generating, generateReport]);

  return { generateReport, openOrGenerate, generating, lastReport, error };
}
