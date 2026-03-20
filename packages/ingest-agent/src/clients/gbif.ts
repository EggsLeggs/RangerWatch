import type { Sighting } from "@rangerwatch/shared";
import type { BoundingBox } from "../types.js";

const BASE_URL = "https://api.gbif.org/v1";
const PAGE_LIMIT = 200;
const MAX_RESULTS = 1000;

// --- raw GBIF types ---

interface GBIFMedia {
  type: string;
  identifier: string;
}

interface GBIFOccurrence {
  key: number;
  decimalLatitude?: number;
  decimalLongitude?: number;
  eventDate?: string;
  occurrenceRemarks?: string;
  media: GBIFMedia[];
}

interface GBIFResponse {
  offset: number;
  limit: number;
  endOfRecords: boolean;
  count: number;
  results: GBIFOccurrence[];
}

// --- helpers ---

function parseEventDate(raw: string | undefined): Date | null {
  if (!raw) return null;
  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) {
    console.warn("[ingest-agent] invalid GBIF eventDate:", raw);
    return null;
  }
  return parsed;
}

function mapOccurrenceToSighting(occ: GBIFOccurrence): Sighting | null {
  const imageMedia = occ.media.find((m) => m.type === "StillImage" && m.identifier);
  if (
    occ.decimalLatitude === undefined ||
    occ.decimalLongitude === undefined ||
    !imageMedia
  ) {
    return null;
  }
  const observedAt = parseEventDate(occ.eventDate);
  if (!observedAt) {
    return null;
  }

  const sighting: Sighting = {
    id: `gbif:${occ.key}`,
    source: "gbif",
    imageUrl: imageMedia.identifier,
    lat: occ.decimalLatitude,
    lng: occ.decimalLongitude,
    observedAt,
  };

  if (occ.occurrenceRemarks) {
    sighting.observerNotes = occ.occurrenceRemarks;
  }

  return sighting;
}

// --- exported client ---

export async function fetchOccurrences(boundingBox: BoundingBox): Promise<Sighting[]> {
  const token = process.env.GBIF_TOKEN?.trim();
  if (!token) {
    console.warn(
      "[ingest-agent] GBIF_TOKEN not set - proceeding unauthenticated (lower rate limits apply)"
    );
  }

  // GBIF uses HTTP Basic auth; GBIF_TOKEN must be "username:password"
  if (token && !token.includes(":")) {
    console.warn("[ingest-agent] GBIF_TOKEN should be in \"username:password\" format for Basic auth");
  }
  const headers: Record<string, string> = token
    ? { Authorization: `Basic ${Buffer.from(token).toString("base64")}` }
    : {};

  const sightings: Sighting[] = [];
  let offset = 0;

  while (sightings.length < MAX_RESULTS) {
    const params = new URLSearchParams({
      basisOfRecord: "HUMAN_OBSERVATION",
      mediaType: "StillImage",
      limit: String(PAGE_LIMIT),
      offset: String(offset),
      decimalLatitude: `${boundingBox.swLat},${boundingBox.neLat}`,
      decimalLongitude: `${boundingBox.swLng},${boundingBox.neLng}`,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    let response: Response;
    try {
      response = await fetch(`${BASE_URL}/occurrence/search?${params}`, {
        headers,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === "AbortError") {
        console.error(`[ingest-agent] GBIF request timed out at offset ${offset}`);
      } else {
        console.error(`[ingest-agent] network error on GBIF offset ${offset}:`, err);
      }
      return sightings;
    }
    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `[ingest-agent] GBIF returned ${response.status} at offset ${offset} - aborting pagination\n${body}`
      );
      return sightings;
    }

    const parsedBody: unknown = await response.json();
    if (
      typeof parsedBody !== "object" ||
      parsedBody === null ||
      !Array.isArray((parsedBody as GBIFResponse).results) ||
      typeof (parsedBody as GBIFResponse).endOfRecords !== "boolean"
    ) {
      console.error(
        `[ingest-agent] invalid GBIF response shape at offset ${offset} - aborting pagination`
      );
      return sightings;
    }
    const body = parsedBody as GBIFResponse;

    for (const occ of body.results) {
      const sighting = mapOccurrenceToSighting(occ);
      if (sighting !== null) sightings.push(sighting);
    }

    if (body.endOfRecords) break;
    offset += PAGE_LIMIT;
  }

  return sightings;
}
