// IUCN_TOKEN is read lazily from process.env rather than via the shared env
// singleton. The shared env module declares IUCN_TOKEN as a required key and
// throws at load time when it is absent, which would prevent the graceful
// null-return path required by this client. Dotenv loading is the
// responsibility of the app entry point.
import type { BoundingBox } from "../types.js";

const BASE_URL = "https://api.iucnredlist.org/api/v4";

// ---------------------------------------------------------------------------
// Internal types — v4 API response shapes
// The v4 OpenAPI spec has sparse schema definitions; types are derived from
// documented fields + live response inspection. Unknown fields are typed as
// [key: string]: unknown to satisfy strict mode without any.
// ---------------------------------------------------------------------------

export interface IucnSpeciesResult {
  speciesName: string;
  category: string;
  rangeBounds?: BoundingBox;
}

// GET /api/v4/taxa/scientific_name
interface IucnV4Scope {
  code: string;
  description: { en: string };
}

interface IucnV4AssessmentSummary {
  assessment_id: number;
  sis_taxon_id: number;
  year_published: string;
  latest: boolean;
  red_list_category_code: string;
  url: string;
  scopes: IucnV4Scope[];
  [key: string]: unknown;
}

interface IucnV4Taxon {
  sis_id: number;
  scientific_name: string;
  genus_name: string;
  species_name: string;
  [key: string]: unknown;
}

interface IucnTaxaResponse {
  taxon: IucnV4Taxon;
  assessments: IucnV4AssessmentSummary[];
  page: number;
  per_page: number;
}

// GET /api/v4/assessment/{id}
// The OpenAPI spec documents no properties beyond assessment_id.
// countries_of_occurrence is inferred from IUCN website data — verified at
// runtime in the test script by logging the raw response.
interface IucnAssessmentLocation {
  code: string;  // ISO alpha-2 country code
  presence: string;
  origin: string;
  [key: string]: unknown;
}

interface IucnAssessmentDetail {
  assessment_id: number;
  locations?: IucnAssessmentLocation[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Country centroids (ISO 3166-1 alpha-2) for bounding-box derivation.
// Covers major biodiversity hotspots across Africa, Asia, and the Americas.
// ---------------------------------------------------------------------------

const COUNTRY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  AO: { lat: -11.20, lng: 17.87 },  // Angola
  AR: { lat: -38.42, lng: -63.62 }, // Argentina
  AU: { lat: -25.27, lng: 133.78 }, // Australia
  BD: { lat: 23.69, lng: 90.35 },   // Bangladesh
  BO: { lat: -16.29, lng: -63.59 }, // Bolivia
  BR: { lat: -10.78, lng: -53.10 }, // Brazil
  BW: { lat: -22.33, lng: 24.68 },  // Botswana
  CA: { lat: 56.13, lng: -106.35 }, // Canada
  CD: { lat: -4.04, lng: 21.76 },   // DR Congo
  CF: { lat: 6.61, lng: 20.94 },    // Central African Republic
  CG: { lat: -0.23, lng: 15.83 },   // Congo
  CI: { lat: 7.54, lng: -5.55 },    // Ivory Coast
  CM: { lat: 7.37, lng: 12.35 },    // Cameroon
  CN: { lat: 35.86, lng: 104.20 },  // China
  CO: { lat: 4.57, lng: -74.30 },   // Colombia
  EC: { lat: -1.83, lng: -78.18 },  // Ecuador
  ET: { lat: 9.15, lng: 40.49 },    // Ethiopia
  GH: { lat: 7.95, lng: -1.02 },    // Ghana
  ID: { lat: -0.79, lng: 113.92 },  // Indonesia
  IN: { lat: 20.59, lng: 78.96 },   // India
  KE: { lat: -0.02, lng: 37.91 },   // Kenya
  KH: { lat: 12.57, lng: 104.99 },  // Cambodia
  LA: { lat: 19.86, lng: 102.50 },  // Laos
  LR: { lat: 6.43, lng: -9.43 },    // Liberia
  MG: { lat: -18.77, lng: 46.87 },  // Madagascar
  MM: { lat: 21.92, lng: 95.96 },   // Myanmar
  MX: { lat: 23.63, lng: -102.55 }, // Mexico
  MZ: { lat: -18.67, lng: 35.53 },  // Mozambique
  NA: { lat: -22.96, lng: 18.49 },  // Namibia
  NG: { lat: 9.08, lng: 8.68 },     // Nigeria
  PE: { lat: -9.19, lng: -75.02 },  // Peru
  PG: { lat: -6.31, lng: 143.96 },  // Papua New Guinea
  PH: { lat: 12.88, lng: 121.77 },  // Philippines
  RU: { lat: 61.52, lng: 105.32 },  // Russia
  SD: { lat: 12.86, lng: 30.22 },   // Sudan
  SL: { lat: 8.46, lng: -11.78 },   // Sierra Leone
  SO: { lat: 5.15, lng: 46.20 },    // Somalia
  SS: { lat: 7.86, lng: 29.69 },    // South Sudan
  TH: { lat: 15.87, lng: 100.99 },  // Thailand
  TZ: { lat: -6.37, lng: 34.89 },   // Tanzania
  UG: { lat: 1.37, lng: 32.29 },    // Uganda
  US: { lat: 37.09, lng: -95.71 },  // United States
  VE: { lat: 6.42, lng: -66.59 },   // Venezuela
  VN: { lat: 14.06, lng: 108.28 },  // Vietnam
  ZA: { lat: -28.47, lng: 24.68 },  // South Africa
  ZM: { lat: -13.13, lng: 27.85 },  // Zambia
  ZW: { lat: -19.02, lng: 29.15 },  // Zimbabwe
};

const RANGE_BUFFER_DEG = 5;
const MAX_RANGE_COUNTRIES = 5;

// ---------------------------------------------------------------------------
// Module-level cache keyed on lowercase species name.
// null = confirmed not found or lookup failed; undefined = not yet looked up.
// ---------------------------------------------------------------------------

const cache = new Map<string, IucnSpeciesResult | null>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getToken(): string | undefined {
  return process.env.IUCN_TOKEN?.trim() || undefined;
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

// Split "Panthera leo" → { genus: "Panthera", epithet: "leo" }.
// Handles trinomials ("Panthera leo leo") via optional infra field.
// Returns null for single-word names — the v4 API requires both params.
function parseSpeciesName(name: string): { genus: string; epithet: string; infra?: string } | null {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return null;
  return {
    genus: parts[0],
    epithet: parts[1],
    ...(parts.length >= 3 ? { infra: parts[2] } : {}),
  };
}

// The v4 taxa endpoint returns all assessments (latest + historic).
// Prefer latest=true with a Global scope (code "1"); fall back to any latest.
function findLatestGlobalAssessment(
  assessments: IucnV4AssessmentSummary[]
): IucnV4AssessmentSummary | null {
  const latestGlobal = assessments.find(
    (a) => a.latest && a.scopes.some((s) => s.code === "1" || s.description.en === "Global")
  );
  if (latestGlobal) return latestGlobal;
  return assessments.find((a) => a.latest) ?? null;
}

async function fetchTaxa(
  genus: string,
  epithet: string,
  infra: string | undefined,
  token: string
): Promise<IucnTaxaResponse | null> {
  const params = new URLSearchParams({ genus_name: genus, species_name: epithet });
  if (infra) params.set("infra_name", infra);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/taxa/scientific_name?${params}`, {
      headers: authHeaders(token),
    });
  } catch (err) {
    console.error(`[threat-agent] network error fetching IUCN taxa for "${genus} ${epithet}":`, err);
    return null;
  }

  if (response.status === 404) return null;

  if (!response.ok) {
    console.error(
      `[threat-agent] IUCN taxa endpoint returned ${response.status} for "${genus} ${epithet}"`
    );
    return null;
  }

  try {
    return (await response.json()) as IucnTaxaResponse;
  } catch (err) {
    console.error(
      `[threat-agent] failed to parse IUCN taxa response for "${genus} ${epithet}":`,
      err
    );
    return null;
  }
}

// Internal: derive range bounds from a known assessment ID.
// Kept separate so lookupSpecies can reuse the assessment_id obtained during
// the taxa fetch, avoiding a redundant second taxa request.
async function rangeFromAssessmentId(
  assessmentId: number,
  token: string
): Promise<BoundingBox | null> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/assessment/${assessmentId}`, {
      headers: authHeaders(token),
    });
  } catch (err) {
    console.error(
      `[threat-agent] network error fetching IUCN assessment ${assessmentId}:`,
      err
    );
    return null;
  }

  if (!response.ok) {
    console.error(
      `[threat-agent] IUCN assessment endpoint returned ${response.status} for id ${assessmentId}`
    );
    return null;
  }

  let detail: IucnAssessmentDetail;
  try {
    detail = (await response.json()) as IucnAssessmentDetail;
  } catch (err) {
    console.error(
      `[threat-agent] failed to parse IUCN assessment response for id ${assessmentId}:`,
      err
    );
    return null;
  }

  if (!Array.isArray(detail.locations) || detail.locations.length === 0) {
    return null;
  }

  const codes = detail.locations.map((c) => c.code);
  return deriveBoundingBox(codes);
}

function deriveBoundingBox(countryCodes: string[]): BoundingBox | null {
  const centroids = countryCodes
    .slice(0, MAX_RANGE_COUNTRIES)
    .map((code) => COUNTRY_CENTROIDS[code.toUpperCase()])
    .filter((c): c is { lat: number; lng: number } => c !== undefined);

  if (centroids.length === 0) return null;

  const lats = centroids.map((c) => c.lat);
  const lngs = centroids.map((c) => c.lng);

  return {
    neLat: Math.min(90, Math.max(...lats) + RANGE_BUFFER_DEG),
    neLng: Math.min(180, Math.max(...lngs) + RANGE_BUFFER_DEG),
    swLat: Math.max(-90, Math.min(...lats) - RANGE_BUFFER_DEG),
    swLng: Math.max(-180, Math.min(...lngs) - RANGE_BUFFER_DEG),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getRangeBounds(speciesName: string): Promise<BoundingBox | null> {
  const token = getToken();
  if (!token) return null;

  const parsed = parseSpeciesName(speciesName);
  if (!parsed) return null;

  const taxa = await fetchTaxa(parsed.genus, parsed.epithet, parsed.infra, token);
  if (!taxa) return null;

  const assessment = findLatestGlobalAssessment(taxa.assessments);
  if (!assessment) return null;

  return rangeFromAssessmentId(assessment.assessment_id, token);
}

export async function lookupSpecies(speciesName: string): Promise<IucnSpeciesResult | null> {
  const key = speciesName.toLowerCase();

  if (key === "unknown") return null;

  if (cache.has(key)) {
    return cache.get(key) ?? null;
  }

  const token = getToken();
  if (!token) {
    console.warn("[threat-agent] IUCN_TOKEN is not set — skipping IUCN lookup");
    return null;
  }

  const parsed = parseSpeciesName(speciesName);
  if (!parsed) {
    cache.set(key, null);
    return null;
  }

  const taxa = await fetchTaxa(parsed.genus, parsed.epithet, parsed.infra, token);
  if (!taxa) {
    cache.set(key, null);
    return null;
  }

  const assessment = findLatestGlobalAssessment(taxa.assessments);
  if (!assessment) {
    cache.set(key, null);
    return null;
  }

  // Reuse the assessment_id from the taxa fetch — avoids a second taxa request
  // inside getRangeBounds.
  const rangeBounds = await rangeFromAssessmentId(assessment.assessment_id, token);

  const result: IucnSpeciesResult = {
    speciesName: taxa.taxon.scientific_name,
    category: assessment.red_list_category_code,
    ...(rangeBounds !== null ? { rangeBounds } : {}),
  };

  cache.set(key, result);
  return result;
}
