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

  return { generateReport, generating, lastReport, error };
}
