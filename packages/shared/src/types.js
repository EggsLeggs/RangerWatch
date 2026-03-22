export var ThreatLevel;
(function (ThreatLevel) {
    ThreatLevel["CRITICAL"] = "CRITICAL";
    ThreatLevel["WARNING"] = "WARNING";
    ThreatLevel["INFO"] = "INFO";
    ThreatLevel["NEEDS_REVIEW"] = "NEEDS_REVIEW";
})(ThreatLevel || (ThreatLevel = {}));
export function isAlertSms(alert) {
    return alert.dispatchMethod === "sms";
}
export function isAlertWebhook(alert) {
    return alert.dispatchMethod === "webhook";
}
export function isAlertBoth(alert) {
    return alert.dispatchMethod === "both";
}
