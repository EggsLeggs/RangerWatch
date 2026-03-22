export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Queued = { alert: Record<string, unknown>; receivedAt: string };

function getQueue(): Queued[] {
  const g = globalThis as typeof globalThis & { __rangerAlertQueue?: Queued[] };
  return g.__rangerAlertQueue ?? [];
}

function zoneIdFromCoords(lat: number, lng: number): string {
  const n = Math.abs(Math.floor(lat * 10 + lng * 10)) % 99;
  return "ZN-" + String(n).padStart(2, "0");
}

function getZoneNameCache(): Map<string, string> {
  const g = globalThis as typeof globalThis & { __rangerZoneNameCache?: Map<string, string> };
  return g.__rangerZoneNameCache ?? new Map();
}

interface SpeciesAccum {
  name: string;
  totalSightings: number;
  lastSeen: string;
  lastZone: string;
  confidenceSum: number;
  iucnStatus: string;
  threatCounts: Record<string, number>;
  imageUrl: string | null;
}

function buildSpeciesIndex(alerts: Record<string, unknown>[], nameMap: Map<string, string>) {
  const map = new Map<string, SpeciesAccum>();

  for (const a of alerts) {
    const species = typeof a["species"] === "string" ? (a["species"] as string) : null;
    if (!species) continue;

    const lat = typeof a["lat"] === "number" ? (a["lat"] as number) : null;
    const lng = typeof a["lng"] === "number" ? (a["lng"] as number) : null;
    const zoneId =
      typeof a["zoneId"] === "string"
        ? (a["zoneId"] as string)
        : lat !== null && lng !== null
          ? zoneIdFromCoords(lat, lng)
          : "Unknown";
    const zoneName =
      typeof a["zoneName"] === "string"
        ? (a["zoneName"] as string)
        : nameMap.get(zoneId) ?? zoneId;

    const rawDate = a["dispatchedAt"] ?? a["receivedAt"];
    const dateStr =
      rawDate instanceof Date
        ? rawDate.toISOString()
        : typeof rawDate === "string"
          ? rawDate
          : new Date().toISOString();

    const confidence = typeof a["confidence"] === "number" ? (a["confidence"] as number) : 0.75;
    const threatLevel = typeof a["threatLevel"] === "string" ? (a["threatLevel"] as string) : "INFO";
    const iucnStatus = typeof a["iucnStatus"] === "string" ? (a["iucnStatus"] as string) : "LC";

    const imageUrl = typeof a["imageUrl"] === "string" ? (a["imageUrl"] as string) : null;

    const existing = map.get(species);
    if (existing) {
      existing.totalSightings++;
      if (dateStr > existing.lastSeen) {
        existing.lastSeen = dateStr;
        existing.lastZone = zoneName;
        if (imageUrl) existing.imageUrl = imageUrl;
      }
      existing.confidenceSum += confidence;
      existing.threatCounts[threatLevel] = (existing.threatCounts[threatLevel] ?? 0) + 1;
      if (iucnStatus !== "LC") existing.iucnStatus = iucnStatus;
    } else {
      map.set(species, {
        name: species,
        totalSightings: 1,
        lastSeen: dateStr,
        lastZone: zoneName,
        confidenceSum: confidence,
        iucnStatus,
        threatCounts: { [threatLevel]: 1 },
        imageUrl,
      });
    }
  }

  return [...map.values()]
    .sort((a, b) => b.totalSightings - a.totalSightings)
    .map((s) => ({
      name: s.name,
      totalSightings: s.totalSightings,
      lastSeen: s.lastSeen,
      lastZone: s.lastZone,
      avgConfidence: Math.round((s.confidenceSum / s.totalSightings) * 100) / 100,
      iucnStatus: s.iucnStatus,
      threatBreakdown: s.threatCounts,
      imageUrl: s.imageUrl,
    }));
}

export async function GET() {
  const nameMap = new Map(getZoneNameCache());

  try {
    const { getCachedAlerts } = await import("@rangerai/shared/db");
    const alerts = await getCachedAlerts();
    if (alerts.length > 0) {
      return Response.json({
        species: buildSpeciesIndex(alerts, nameMap),
      });
    }
  } catch {
    // fall through to queue
  }

  const queueAlerts = getQueue().map((q) => ({ ...q.alert, receivedAt: q.receivedAt }));
  return Response.json({
    species: buildSpeciesIndex(queueAlerts, nameMap),
  });
}
