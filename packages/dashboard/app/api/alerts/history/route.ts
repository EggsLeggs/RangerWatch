export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const { getCollection, COLLECTIONS } = await import("@rangerai/shared/db");
    const col = await getCollection(COLLECTIONS.ALERTS);
    const alerts = await col.find({}).sort({ dispatchedAt: -1 }).limit(100).toArray();
    return Response.json({ alerts, total: alerts.length });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
