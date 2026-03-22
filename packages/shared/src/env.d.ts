export declare function validateRequiredEnv(): void;
export declare const env: {
    readonly INATURALIST_API_KEY: string | undefined;
    readonly GBIF_TOKEN: string;
    readonly IUCN_TOKEN: string;
    readonly OPENAI_API_KEY: string;
    readonly CIVIC_API_KEY: string;
    readonly MCP_PORT: number;
    readonly RESEND_ENABLED: boolean;
    readonly RESEND_API_KEY: string | undefined;
    readonly ALERT_FROM_EMAIL: string | undefined;
    readonly ALERT_TO_EMAIL: string | undefined;
    readonly DASHBOARD_ALERT_API_KEY: string | undefined;
    readonly WEBHOOK_URL: string;
    readonly INATURALIST_MAX_RESULTS: number;
    readonly MONGODB_URI: string;
};
export type Env = typeof env;
export declare const OPTIONAL_AT_LOAD_KEYS: readonly ["INATURALIST_API_KEY", "RESEND_API_KEY", "ALERT_FROM_EMAIL", "ALERT_TO_EMAIL", "DASHBOARD_ALERT_API_KEY"];
//# sourceMappingURL=env.d.ts.map