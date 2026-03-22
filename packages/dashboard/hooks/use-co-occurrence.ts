import { useState, useEffect } from "react";

export interface CoOccurrencePair {
  species1: string;
  species2: string;
  count: number;
  zones: string[];
}

export interface CoOccurrenceNode {
  species: string;
  totalSightings: number;
  iucnStatus: string | null;
}

interface CoOccurrenceResponse {
  pairs: CoOccurrencePair[];
  nodes: CoOccurrenceNode[];
}

interface UseCoOccurrenceParams {
  hours?: number;
}

interface UseCoOccurrenceResult {
  pairs: CoOccurrencePair[];
  nodes: CoOccurrenceNode[];
  loading: boolean;
  error: boolean;
}

export function useCoOccurrence({ hours = 24 }: UseCoOccurrenceParams = {}): UseCoOccurrenceResult {
  const [data, setData] = useState<CoOccurrenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const doFetch = async () => {
      try {
        const params = new URLSearchParams({ hours: String(hours) });
        const res = await fetch(`/api/wildlife/co-occurrence?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("co-occurrence fetch failed");
        const json = (await res.json()) as CoOccurrenceResponse;
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
  }, [hours]);

  return {
    pairs: data?.pairs ?? [],
    nodes: data?.nodes ?? [],
    loading,
    error,
  };
}
