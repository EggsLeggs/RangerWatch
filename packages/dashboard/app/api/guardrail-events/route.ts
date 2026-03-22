export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { getCollection, COLLECTIONS } = await import("@rangerai/shared/db");
  const col = await getCollection(COLLECTIONS.GUARDRAIL_EVENTS);
  const events = await col.find({}).sort({ timestamp: -1 }).limit(200).toArray();
  return Response.json({ events, total: events.length });
}
