import type { ClassifiedSighting, GuardrailResult } from "@rangerwatch/shared";
import { env } from "@rangerwatch/shared/env";

const CIVIC_TIMEOUT_MS = 3000;
const TOOL_NAME = "inspect_output";

export async function inspectOutput(
  classified: ClassifiedSighting
): Promise<GuardrailResult> {
  const payload = JSON.stringify(classified);
  const timestamp = new Date();

  try {
    const response = await fetch(
      `http://localhost:${env.MCP_PORT}/${TOOL_NAME}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
        signal: AbortSignal.timeout(CIVIC_TIMEOUT_MS),
      }
    );

    const result = (await response.json()) as GuardrailResult;

    if (result.blocked) {
      console.warn(
        `[vision-agent] civic guardrail blocked sighting ${classified.id}: ${result.reason ?? "no reason given"}`
      );
    }

    return { ...result, timestamp: new Date(result.timestamp) };
  } catch {
    console.warn(
      `[vision-agent] civic-mcp unavailable for sighting ${classified.id}; proceeding without guardrail`
    );
    return {
      input: payload,
      output: "",
      blocked: false,
      reason: "civic-mcp unavailable",
      toolName: TOOL_NAME,
      timestamp,
    };
  }
}
