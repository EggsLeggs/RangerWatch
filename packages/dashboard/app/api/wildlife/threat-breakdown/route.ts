export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type FlatAlert = Record<string, unknown>;

function getQueue(): { alert: FlatAlert; receivedAt: string }[] {
  const g = globalThis as typeof globalThis & {
    __rangerAlertQueue?: { alert: FlatAlert; receivedAt: string }[];
  };
  return g.__rangerAlertQueue ?? [];
}

const IUCN_LABELS: Record<string, string> = {
  CR: "Critically Endangered",
  EN: "Endangered",
  VU: "Vulnerable",
  NT: "Near Threatened",
  LC: "Least Concern",
  DD: "Data Deficient",
  EX: "Extinct",
  EW: "Extinct in Wild",
};

export async function GET() {
  let alerts: FlatAlert[] = [];

  try {
    const { getCollection, COLLECTIONS } = await import("@rangerai/shared/db");
    const col = await getCollection(COLLECTIONS.ALERTS);
    const raw = await col.find({}).limit(5000).toArray();
    alerts = raw as FlatAlert[];
  } catch {
    // fall back to queue
  }

  if (alerts.length === 0) {
    alerts = getQueue().map((q) => ({ ...q.alert, receivedAt: q.receivedAt }));
  }

  const iucnCounts = new Map<string, number>();
  const anomalyBuckets: number[] = Array(10).fill(0);
  const threatCounts: Record<string, number> = {
    CRITICAL: 0,
    WARNING: 0,
    INFO: 0,
    NEEDS_REVIEW: 0,
  };

  for (const a of alerts) {
    const iucn = typeof a["iucnStatus"] === "string" ? a["iucnStatus"] : null;
    if (iucn) iucnCounts.set(iucn, (iucnCounts.get(iucn) ?? 0) + 1);

    const score = typeof a["anomalyScore"] === "number" ? a["anomalyScore"] : null;
    if (score !== null) {
      const bucketIdx = Math.min(9, Math.floor(score / 10));
      anomalyBuckets[bucketIdx]++;
    }

    const tl = typeof a["threatLevel"] === "string" ? a["threatLevel"] : "INFO";
    const key = ["CRITICAL", "WARNING", "INFO", "NEEDS_REVIEW"].includes(tl) ? tl : "INFO";
    threatCounts[key] = (threatCounts[key] ?? 0) + 1;
  }

  const iucnBreakdown = [...iucnCounts.entries()].map(([status, count]) => ({
    status,
    label: IUCN_LABELS[status] ?? status,
    count,
  }));

  const anomalyHistogram = anomalyBuckets.map((count, i) => ({
    bucket: `${i * 10}-${i * 10 + 9}`,
    count,
  }));

  return Response.json({ iucnBreakdown, anomalyHistogram, threatCounts });
}
