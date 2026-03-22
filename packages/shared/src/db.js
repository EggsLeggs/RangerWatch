import { MongoClient } from "mongodb";
let client = null;
let db = null;
let connectPromise = null;
export const COLLECTIONS = {
    SIGHTINGS: "sightings",
    CLASSIFIED: "classified",
    SCORED: "scored",
    ALERTS: "alerts",
    REPORTS: "reports",
    GUARDRAIL_EVENTS: "guardrail_events",
};
export async function connectDB() {
    if (db)
        return db;
    if (!connectPromise) {
        connectPromise = (async () => {
            const uri = process.env.MONGODB_URI?.trim();
            if (!uri)
                throw new Error("missing required environment variable: MONGODB_URI.");
            client = new MongoClient(uri);
            await client.connect();
            db = client.db("rangerai");
            return db;
        })().catch((err) => {
            connectPromise = null;
            throw err;
        });
    }
    return connectPromise;
}
export async function getCollection(name) {
    const database = await connectDB();
    return database.collection(name);
}
