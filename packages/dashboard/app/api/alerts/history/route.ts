export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { getCollection, COLLECTIONS } = await import("@rangerai/shared/db");
  const col = await getCollection(COLLECTIONS.ALERTS);
  const alerts = await col.find({}).sort({ dispatchedAt: -1 }).limit(100).toArray();
  return Response.json({ alerts, total: alerts.length });
}
