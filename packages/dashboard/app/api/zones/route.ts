export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Queued = { alert: Record<string, unknown>; receivedAt: string };

function getQueue(): Queued[] {
  const g = globalThis as typeof globalThis & { __rangerAlertQueue?: Queued[] };
  return g.__rangerAlertQueue ?? [];
}

function getZoneNameCache(): Map<string, string> {
  const g = globalThis as typeof globalThis & { __rangerZoneNameCache?: Map<string, string> };
  return g.__rangerZoneNameCache ?? new Map();
}

function zoneIdFromCoords(lat: number, lng: number): string {
  const n = Math.abs(Math.floor(lat * 10 + lng * 10)) % 99;
  return "ZN-" + String(n).padStart(2, "0");
}

function buildZones(
  alerts: Record<string, unknown>[],
  since: number,
  nameMap: Map<string, string>,
) {
  const zoneMap = new Map<string, { count: number; atRisk: boolean; criticalSpecies: Set<string>; criticalCount: number }>();

  for (const alert of alerts) {
    const raw = alert["dispatchedAt"] ?? alert["receivedAt"];
    const d = raw instanceof Date ? raw : typeof raw === "string" ? new Date(raw) : null;
    if (!d || isNaN(d.getTime()) || d.getTime() < since) continue;

    const lat = typeof alert["lat"] === "number" ? (alert["lat"] as number) : null;
    const lng = typeof alert["lng"] === "number" ? (alert["lng"] as number) : null;
    if (lat === null || lng === null) continue;

    // prefer stored zoneId, fall back to computed
    const id =
      typeof alert["zoneId"] === "string"
        ? (alert["zoneId"] as string)
        : zoneIdFromCoords(lat, lng);

    // prefer stored zoneName, then cache, then id
    const storedName = typeof alert["zoneName"] === "string" ? (alert["zoneName"] as string) : null;
    if (storedName && !nameMap.has(id)) nameMap.set(id, storedName);

    const cur = zoneMap.get(id) ?? { count: 0, atRisk: false, criticalSpecies: new Set<string>(), criticalCount: 0 };
    cur.count++;
    if (alert["threatLevel"] === "CRITICAL") {
      cur.atRisk = true;
      cur.criticalCount++;
      const species = typeof alert["species"] === "string" ? (alert["species"] as string) : null;
      if (species) cur.criticalSpecies.add(species);
    }
    zoneMap.set(id, cur);
  }

  const totalAnimals = [...zoneMap.values()].reduce((s, z) => s + z.count, 0);
  const entries = [...zoneMap.entries()].sort((a, b) => b[1].count - a[1].count);
  const top8 = entries.slice(0, 8);
  const maxCount = top8[0]?.[1].count ?? 1;

  const zones = top8.map(([id, data]) => {
    let atRiskReason: string | undefined;
    if (data.atRisk) {
      const speciesList = [...data.criticalSpecies].slice(0, 3);
      const parts: string[] = [];
      parts.push(`${data.criticalCount} critical alert${data.criticalCount > 1 ? "s" : ""}`);
      if (speciesList.length > 0) {
        const extra = data.criticalSpecies.size - speciesList.length;
        parts.push(speciesList.join(", ") + (extra > 0 ? ` +${extra} more` : ""));
      }
      atRiskReason = parts.join(" - ");
    }
    return {
      id,
      name: nameMap.get(id) ?? id,
      coverage: Math.round((data.count / maxCount) * 100),
      atRisk: data.atRisk,
      atRiskReason,
      color: data.atRisk ? "#c85a3a" : "#4a7c5a",
    };
  });

  return { zones, totalAnimals };
}

export async function GET() {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const nameMap = new Map(getZoneNameCache());

  // attempt MongoDB via shared cache
  try {
    const { getCachedAlerts } = await import("@rangerai/shared/db");
    const alerts = await getCachedAlerts();

    if (alerts.length > 0) {
      return Response.json(buildZones(alerts, since, nameMap));
    }
  } catch {
    // fall through to queue
  }

  // fall back to in-memory queue
  const queueAlerts = getQueue().map((q) => ({ ...q.alert, receivedAt: q.receivedAt }));
  return Response.json(buildZones(queueAlerts, since, nameMap));
}
