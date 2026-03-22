export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const { getCollection, COLLECTIONS } = await import("@rangerai/shared/db");
    const col = await getCollection(COLLECTIONS.GUARDRAIL_EVENTS);
    const [events, total] = await Promise.all([
      col.find({}).sort({ timestamp: -1 }).limit(200).toArray(),
      col.countDocuments(),
    ]);
    return Response.json({ events, total });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
