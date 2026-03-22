import { useState, useEffect } from "react";

export interface SpeciesIndexEntry {
  name: string;
  totalSightings: number;
  lastSeen: string | null;
  lastZone: string | null;
  avgConfidence: number | null;
  iucnStatus: string | null;
  threatBreakdown: Record<string, number>;
  imageUrl: string | null;
}

interface SpeciesIndexResponse {
  species: SpeciesIndexEntry[];
}

interface UseSpeciesIndexResult {
  species: SpeciesIndexEntry[];
  loading: boolean;
  error: boolean;
}

export function useSpeciesIndex(): UseSpeciesIndexResult {
  const [data, setData] = useState<SpeciesIndexResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const doFetch = async () => {
      try {
        const res = await fetch("/api/wildlife/species-index", { signal: controller.signal });
        if (!res.ok) throw new Error("species-index fetch failed");
        const json = (await res.json()) as SpeciesIndexResponse;
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
    species: data?.species ?? [],
    loading,
    error,
  };
}
