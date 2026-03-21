import { type Alert, type GuardrailResult, isAlertBoth } from "@rangerai/shared";
import { buildCivicHeaders } from "@rangerai/shared";
import { env } from "@rangerai/shared/env";

const CIVIC_TIMEOUT_MS = 3000;

export async function inspectAlert(alert: Alert): Promise<GuardrailResult> {
  // Serialise formattedMessage to string (AlertBoth has { sms, webhook } object)
  const payload = isAlertBoth(alert)
    ? JSON.stringify(alert.formattedMessage)
    : alert.formattedMessage;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CIVIC_TIMEOUT_MS);

  try {
    const headers = await buildCivicHeaders();
    const res = await fetch(
      `http://localhost:${env.MCP_PORT}/inspect_input`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ payload, toolName: "alert:dispatch" }),
        signal: controller.signal,
      }
    );
    clearTimeout(timer);
    if (!res.ok) {
      return { input: payload, output: "", blocked: false, reason: "civic-mcp unavailable", toolName: "alert:dispatch", timestamp: new Date() };
    }
    const result = (await res.json()) as GuardrailResult;
    // Coerce timestamp string -> Date if civic-mcp returns ISO string
    if (typeof (result as unknown as { timestamp: unknown }).timestamp === "string") {
      (result as { timestamp: Date }).timestamp = new Date(
        (result as unknown as { timestamp: string }).timestamp
      );
    }
    if (result.blocked) {
      console.warn(`[alert-agent] guardrail blocked alert ${alert.alertId}: ${result.reason}`);
    }
    return result;
  } catch {
    clearTimeout(timer);
    return {
      input: payload,
      output: "",
      blocked: false,
      reason: "civic-mcp unavailable",
      toolName: "alert:dispatch",
      timestamp: new Date(),
    };
  }
}
