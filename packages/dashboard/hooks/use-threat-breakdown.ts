import { useState, useEffect } from "react";

export interface IucnBreakdownItem {
  status: string;
  label: string;
  count: number;
}

export interface AnomalyHistogramItem {
  bucket: string;
  count: number;
}

interface ThreatBreakdownResponse {
  iucnBreakdown: IucnBreakdownItem[];
  anomalyHistogram: AnomalyHistogramItem[];
  threatCounts: Record<string, number>;
}

interface UseThreatBreakdownResult {
  iucnBreakdown: IucnBreakdownItem[];
  anomalyHistogram: AnomalyHistogramItem[];
  threatCounts: Record<string, number>;
  loading: boolean;
  error: boolean;
}

export function useThreatBreakdown(): UseThreatBreakdownResult {
  const [data, setData] = useState<ThreatBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const doFetch = async () => {
      try {
        const res = await fetch("/api/wildlife/threat-breakdown", { signal: controller.signal });
        if (!res.ok) throw new Error("threat-breakdown fetch failed");
        const json = (await res.json()) as ThreatBreakdownResponse;
        setData(json);
        setError(false);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    setLoading(true);
    doFetch();

    return () => controller.abort();
  }, []);

  return {
    iucnBreakdown: data?.iucnBreakdown ?? [],
    anomalyHistogram: data?.anomalyHistogram ?? [],
    threatCounts: data?.threatCounts ?? { CRITICAL: 0, WARNING: 0, INFO: 0, NEEDS_REVIEW: 0 },
    loading,
    error,
  };
}
