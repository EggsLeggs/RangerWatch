import { useState, useEffect } from "react";

export interface TimelineSighting {
  timestamp: string | null;
  threatLevel: string;
  species: string | null;
  alertId: string | null;
}

interface TimelineResponse {
  sightings: TimelineSighting[];
}

interface UseWildlifeTimelineParams {
  from?: string;
  to?: string;
}

interface UseWildlifeTimelineResult {
  sightings: TimelineSighting[];
  loading: boolean;
  error: boolean;
}

export function useWildlifeTimeline({ from, to }: UseWildlifeTimelineParams = {}): UseWildlifeTimelineResult {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const doFetch = async () => {
      try {
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        const qs = params.toString();
        const res = await fetch(`/api/wildlife/timeline${qs ? `?${qs}` : ""}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("timeline fetch failed");
        const json = (await res.json()) as TimelineResponse;
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
  }, [from, to]);

  return {
    sightings: data?.sightings ?? [],
    loading,
    error,
  };
}
