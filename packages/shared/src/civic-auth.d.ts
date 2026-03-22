/**
 * Civic Auth client-credentials token helper.
 *
 * Exchanges CIVIC_CLIENT_ID + CIVIC_API_KEY for a short-lived JWT from
 * Civic's hosted OIDC service (https://auth.civic.com/oauth/token) and
 * caches it until 60 seconds before expiry.
 *
 * Returns null when credentials are absent or the exchange fails - callers
 * treat null as "skip auth header", which will result in a 401 from
 * civic-mcp (handled gracefully by the fail-open fallback in each agent).
 */
export declare function getCivicToken(): Promise<string | null>;
/**
 * Builds the standard headers object for requests to civic-mcp.
 * Sets Content-Type and conditionally adds Authorization if a token is available.
 */
export declare function buildCivicHeaders(): Promise<Record<string, string>>;
//# sourceMappingURL=civic-auth.d.ts.map