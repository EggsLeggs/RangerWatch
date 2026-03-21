import type { GuardrailResult } from "@rangerwatch/shared";
import { buildCivicHeaders } from "@rangerwatch/shared";

const CIVIC_TIMEOUT_MS = 3000;

function getMcpPort(): number {
  const raw = process.env.MCP_PORT?.trim();
  if (!raw) return 3001;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 && n <= 65535 ? n : 3001;
}

export async function inspectInput(
  payload: string,
  toolName: string
): Promise<GuardrailResult> {
  try {
    const response = await fetch(`http://localhost:${getMcpPort()}/inspect_input`, {
      method: "POST",
      headers: await buildCivicHeaders(),
      body: JSON.stringify({ payload, toolName }),
      signal: AbortSignal.timeout(CIVIC_TIMEOUT_MS),
    });
    if (!response.ok) {
      return {
        input: payload,
        output: payload,
        blocked: false,
        reason: `civic-mcp returned ${response.status}`,
        toolName,
        timestamp: new Date(),
      };
    }
    const result = (await response.json()) as GuardrailResult;
    // timestamp arrives as a string from JSON - convert to Date for type safety
    result.timestamp = new Date((result.timestamp as unknown) as string);
    if (result.blocked) {
      console.warn(
        `[threat-agent] civic inspect_input blocked toolName=${toolName} reason=${result.reason ?? "unspecified"}`
      );
    }
    return result;
  } catch (err) {
    console.warn(
      `[threat-agent] civic-mcp check failed (toolName=${toolName}):`,
      err instanceof Error ? err.message : err
    );
    return {
      input: payload,
      output: payload,
      blocked: false,
      reason: "civic-mcp unavailable",
      toolName,
      timestamp: new Date(),
    };
  }
}

export async function guardedFetch(
  url: string,
  toolName: string,
  options?: RequestInit
): Promise<Response | null> {
  const guardrail = await inspectInput(url, toolName);
  if (guardrail.blocked) {
    console.warn(
      `[threat-agent] guardedFetch blocked url=${url} toolName=${toolName} reason=${guardrail.reason ?? "unspecified"}`
    );
    return null;
  }
  return fetch(url, options ?? {});
}
