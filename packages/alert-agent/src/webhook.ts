import { env } from "@rangerwatch/shared/env";
import type { Alert } from "@rangerwatch/shared";
import { alertEvents, ALERT_DISPATCHED } from "./events.js";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export async function dispatchWebhook(alert: Alert): Promise<boolean> {
  const url = env.WEBHOOK_URL;
  if (!url) {
    console.warn("[alert-agent] WEBHOOK_URL is not configured — skipping dispatch");
    return false;
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alert),
      });

      console.log(`[alert-agent] webhook attempt ${attempt} — status ${res.status}`);

      if (res.ok) {
        alertEvents.emit(ALERT_DISPATCHED, {
          type: ALERT_DISPATCHED,
          payload: { alert, method: "webhook" },
          timestamp: new Date(),
        });
        return true;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`[alert-agent] webhook attempt ${attempt} — error: ${message}`);
    }

    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  console.warn(`[alert-agent] webhook dispatch failed after ${MAX_RETRIES} attempts — alert ${alert.alertId} not delivered`);
  return false;
}
