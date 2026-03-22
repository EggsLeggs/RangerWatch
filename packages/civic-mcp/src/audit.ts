import type { GuardrailResult } from "@rangerai/shared";

const MAX_ENTRIES = 1000;
const log: GuardrailResult[] = [];

export function logEntry(result: GuardrailResult): void {
  if (log.length >= MAX_ENTRIES) log.shift();
  log.push(result);
  if (result.blocked) {
    console.warn("[civic-mcp] blocked:", result.toolName, result.reason);
  } else {
    console.log("[civic-mcp] passed:", result.toolName ?? "unknown");
  }
  (async () => {
    try {
      const { getCollection, COLLECTIONS } = await import("@rangerai/shared");
      const col = await getCollection(COLLECTIONS.GUARDRAIL_EVENTS);
      await col.insertOne({ ...result, timestamp: new Date() });
    } catch { /* never throw from audit logging */ }
  })();
}

export function getAuditLog(): { total: number; blocked: number; entries: GuardrailResult[] } {
  return {
    total: log.length,
    blocked: log.filter((e) => e.blocked).length,
    entries: [...log],
  };
}
