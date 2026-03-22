import { type Db, type Collection, type Document } from "mongodb";
export declare const COLLECTIONS: {
    readonly SIGHTINGS: "sightings";
    readonly CLASSIFIED: "classified";
    readonly SCORED: "scored";
    readonly ALERTS: "alerts";
    readonly REPORTS: "reports";
    readonly GUARDRAIL_EVENTS: "guardrail_events";
};
export declare function connectDB(): Promise<Db>;
export declare function getCollection<T extends Document>(name: string): Promise<Collection<T>>;
//# sourceMappingURL=db.d.ts.map