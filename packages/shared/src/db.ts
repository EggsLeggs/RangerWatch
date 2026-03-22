import { MongoClient, type Db, type Collection, type Document } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export const COLLECTIONS = {
  SIGHTINGS: "sightings",
  CLASSIFIED: "classified",
  SCORED: "scored",
  ALERTS: "alerts",
  REPORTS: "reports",
  GUARDRAIL_EVENTS: "guardrail_events",
} as const;

export async function connectDB(): Promise<Db> {
  if (db) return db;
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error("missing required environment variable: MONGODB_URI.");
  client = new MongoClient(uri);
  await client.connect();
  db = client.db("rangerai");
  return db;
}

export async function getCollection<T extends Document>(name: string): Promise<Collection<T>> {
  const database = await connectDB();
  return database.collection<T>(name);
}
