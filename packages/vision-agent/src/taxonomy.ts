import type { ClassifiedSighting } from "@rangerwatch/shared";
import { env } from "@rangerwatch/shared/env";

interface InatTaxon {
  id: number;
  name: string;
  rank: string;
  matched_term?: string;
}

interface InatTaxaResponse {
  results: InatTaxon[];
  total_results: number;
}

const taxonCache = new Map<string, string | null>();

export async function lookupTaxon(speciesName: string): Promise<string | null> {
  if (!speciesName || speciesName === "unknown") return null;

  if (taxonCache.has(speciesName)) {
    return taxonCache.get(speciesName)!;
  }

  try {
    const params = new URLSearchParams({
      q: speciesName,
      rank: "species",
      per_page: "1",
    });

    const headers: Record<string, string> = {};
    if (env.INATURALIST_API_KEY) {
      headers["Authorization"] = `Bearer ${env.INATURALIST_API_KEY}`;
    }

    const response = await fetch(
      `https://api.inaturalist.org/v1/taxa?${params}`,
      { headers }
    );

    if (!response.ok) {
      console.warn(
        `[vision-agent] iNaturalist taxa lookup returned ${response.status} for "${speciesName}"`
      );
      taxonCache.set(speciesName, null);
      return null;
    }

    const body = (await response.json()) as InatTaxaResponse;
    const result = body.results[0] ? String(body.results[0].id) : null;
    taxonCache.set(speciesName, result);
    return result;
  } catch (err) {
    console.warn(
      `[vision-agent] iNaturalist taxa lookup failed for "${speciesName}":`,
      err
    );
    taxonCache.set(speciesName, null);
    return null;
  }
}

export async function attachTaxon(
  classified: ClassifiedSighting
): Promise<ClassifiedSighting> {
  const taxonId = await lookupTaxon(classified.species);
  return { ...classified, taxonId };
}
