import { type ScoredSighting, type Alert } from "@rangerai/shared";
import { formatAlert } from "./formatter.js";
import { inspectAlert } from "./guardrail.js";
import { dispatchWebhook } from "./webhook.js";
import { dispatchEmail } from "./email.js";

export async function dispatchAlert(sighting: ScoredSighting): Promise<void> {
  const alert: Alert = formatAlert(sighting);
  const guardrail = await inspectAlert(alert);

  if (guardrail.blocked) {
    console.warn(
      `[alert-agent] dispatch blocked — alertId=${alert.alertId} ` +
      `threatLevel=${alert.threatLevel} reason=${guardrail.reason}`
    );
    return;
  }

  console.log(
    `[alert-agent] dispatching — alertId=${alert.alertId} ` +
    `threatLevel=${alert.threatLevel} method=${alert.dispatchMethod} ` +
    `blocked=false`
  );

  await dispatchWebhook(alert);

  if (alert.dispatchMethod === "both") {
    await dispatchEmail(alert);
  }
}
