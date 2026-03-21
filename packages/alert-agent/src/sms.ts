import { type Alert, ThreatLevel, isAlertBoth, isAlertSms } from "@rangerai/shared";
import { ALERT_DISPATCHED, alertEvents } from "./events.js";

export async function dispatchSMS(alert: Alert): Promise<boolean> {
  if (alert.threatLevel !== ThreatLevel.CRITICAL) return true;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const to = process.env.TWILIO_TO_NUMBER;

  if (!sid || !token || !from || !to) {
    console.log("[alert-agent] Twilio not configured — SMS stubbed");
    return true;
  }

  const body =
    isAlertBoth(alert) ? alert.formattedMessage.sms
    : isAlertSms(alert) ? alert.formattedMessage
    : null;

  if (!body) return false;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const authHeader = `Basic ${btoa(`${sid}:${token}`)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    });

    if (!res.ok) {
      console.error(`[alert-agent] Twilio error: ${res.status} ${res.statusText}`);
      return false;
    }

    alertEvents.emit(ALERT_DISPATCHED, {
      type: "alert:dispatched",
      payload: { alert, method: "sms" },
      timestamp: new Date(),
    });

    return true;
  } catch (err) {
    console.error("[alert-agent] Twilio fetch failed:", err);
    return false;
  }
}
