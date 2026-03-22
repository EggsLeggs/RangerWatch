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

function isLikelyObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

function stringifyId(id: unknown): string {
  if (typeof id === "string") return id;
  if (id && typeof id === "object" && "toString" in id && typeof (id as { toString: () => string }).toString === "function") {
    return (id as { toString: () => string }).toString();
  }
  return "";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!isLikelyObjectId(id)) {
      return Response.json({ error: "report not found" }, { status: 404 });
    }

    const { getCollection, COLLECTIONS } = await import("@rangerai/shared/db");
    const col = await getCollection<ReportDoc>(COLLECTIONS.REPORTS);
    const report = await col.findOne({
      $expr: { $eq: [{ $toString: "$_id" }, id] },
    });
    if (!report) {
      return Response.json({ error: "report not found" }, { status: 404 });
    }

    return Response.json({
      ...report,
      _id: stringifyId(report._id),
    });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
