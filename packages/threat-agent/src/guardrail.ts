import type { GuardrailResult } from "@rangerwatch/shared";
import { getCivicToken } from "@rangerwatch/shared";

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
    const token = await getCivicToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`http://localhost:${getMcpPort()}/inspect_input`, {
      method: "POST",
      headers,
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
    if (result.blocked) {
      console.warn(
        `[threat-agent] civic inspect_input blocked toolName=${toolName} reason=${result.reason ?? "unspecified"}`
      );
    }
    return result;
  } catch {
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
