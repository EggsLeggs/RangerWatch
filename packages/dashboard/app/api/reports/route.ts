export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ReportDoc = {
  _id: unknown;
  filePath: string;
  generatedAt: Date | string;
  species: string;
  alertId?: string;
  reportUrl?: string;
};

function stringifyId(id: unknown): string {
  if (typeof id === "string") return id;
  if (id && typeof id === "object" && "toString" in id && typeof (id as { toString: () => string }).toString === "function") {
    return (id as { toString: () => string }).toString();
  }
  return "";
}

export async function GET() {
  try {
    const { getCollection, COLLECTIONS } = await import("@rangerai/shared/db");
    const col = await getCollection<ReportDoc>(COLLECTIONS.REPORTS);
    const reports = await col.find({ reportUrl: { $exists: true, $ne: "" } }).sort({ generatedAt: -1 }).limit(200).toArray();
    return Response.json({
      reports: reports.map((r) => ({
        ...r,
        _id: stringifyId(r._id),
      })),
      total: reports.length,
    });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
