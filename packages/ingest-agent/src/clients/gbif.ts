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

function parseEventDate(raw: string | undefined): Date {
  if (!raw) return new Date();
  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
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

  const sighting: Sighting = {
    id: `gbif:${occ.key}`,
    source: "gbif",
    imageUrl: imageMedia.identifier,
    lat: occ.decimalLatitude,
    lng: occ.decimalLongitude,
    observedAt: parseEventDate(occ.eventDate),
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
      "[ingest-agent] GBIF_TOKEN not set — proceeding unauthenticated (lower rate limits apply)"
    );
  }

  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
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

    let response: Response;
    try {
      response = await fetch(`${BASE_URL}/occurrence/search?${params}`, { headers });
    } catch (err) {
      console.error(`[ingest-agent] network error on GBIF offset ${offset}:`, err);
      return sightings;
    }

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `[ingest-agent] GBIF returned ${response.status} at offset ${offset} — aborting pagination\n${body}`
      );
      return sightings;
    }

    const body = (await response.json()) as GBIFResponse;

    for (const occ of body.results) {
      const sighting = mapOccurrenceToSighting(occ);
      if (sighting !== null) sightings.push(sighting);
    }

    if (body.endOfRecords) break;
    offset += PAGE_LIMIT;
  }

  return sightings;
}
