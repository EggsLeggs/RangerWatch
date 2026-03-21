export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AuditPayload = {
  total?: number;
  blocked?: number;
  entries?: { blocked?: boolean; reason?: string }[];
};

export async function GET() {
  const port = process.env.MCP_PORT?.trim() || "3001";
  try {
    const res = await fetch(`http://127.0.0.1:${port}/audit_log`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return Response.json(
        { totalCalls: 0, injectionsBlocked: 0, errors: 0, unavailable: true },
        { status: 200 },
      );
    }
    const data = (await res.json()) as AuditPayload;
    const entries = Array.isArray(data.entries) ? data.entries : [];
    const errors = entries.filter(
      (e) => typeof e.reason === "string" && e.reason.startsWith("guardrail-error:"),
    ).length;
    const injectionsBlocked = entries.filter(
      (e) =>
        e.blocked === true &&
        !(typeof e.reason === "string" && e.reason.startsWith("guardrail-error:")),
    ).length;
    const totalCalls = typeof data.total === "number" ? data.total : entries.length;

    return Response.json({
      totalCalls,
      injectionsBlocked,
      errors,
      unavailable: false,
    });
  } catch {
    return Response.json(
      { totalCalls: 0, injectionsBlocked: 0, errors: 0, unavailable: true },
      { status: 200 },
    );
  }
}
