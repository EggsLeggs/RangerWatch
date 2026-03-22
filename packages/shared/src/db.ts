import { MongoClient, type Db, type Collection, type Document } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;
let connectPromise: Promise<Db> | null = null;
let failedAt: number | null = null;
let indexesEnsured = false;
const FAILURE_COOLDOWN_MS = 30_000;

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
  if (failedAt && Date.now() - failedAt < FAILURE_COOLDOWN_MS) {
    throw new Error("MongoDB unavailable (cached failure, will retry shortly)");
  }
  if (!connectPromise) {
    connectPromise = (async () => {
      const uri = process.env.MONGODB_URI?.trim();
      if (!uri) throw new Error("missing required environment variable: MONGODB_URI.");
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 4_000,
        connectTimeoutMS: 4_000,
        socketTimeoutMS: 8_000,
      });
      await client.connect();
      failedAt = null;
      db = client.db("rangerai");

      if (!indexesEnsured) {
        indexesEnsured = true;
        ensureIndexes(db).catch(() => {});
      }

      return db;
    })().catch((err) => {
      connectPromise = null;
      failedAt = Date.now();
      throw err;
    });
  }
  return connectPromise;
}

async function ensureIndexes(database: Db): Promise<void> {
  const bg = { background: true } as const;

  const alerts = database.collection(COLLECTIONS.ALERTS);
  await Promise.allSettled([
    alerts.createIndex({ dispatchedAt: -1 }, bg),
    alerts.createIndex({ alertId: 1 }, { unique: true, ...bg }),
    alerts.createIndex({ threatLevel: 1, dispatchedAt: -1 }, bg),
    alerts.createIndex({ species: 1, dispatchedAt: -1 }, bg),
  ]);

  const reports = database.collection(COLLECTIONS.REPORTS);
  await Promise.allSettled([
    reports.createIndex({ generatedAt: -1 }, bg),
    reports.createIndex({ alertId: 1 }, bg),
  ]);

  const sightings = database.collection(COLLECTIONS.SIGHTINGS);
  await Promise.allSettled([
    sightings.createIndex({ id: 1, source: 1 }, { unique: true, ...bg }),
  ]);

  const classified = database.collection(COLLECTIONS.CLASSIFIED);
  await Promise.allSettled([
    classified.createIndex({ id: 1 }, { unique: true, ...bg }),
  ]);

  const scored = database.collection(COLLECTIONS.SCORED);
  await Promise.allSettled([
    scored.createIndex({ id: 1 }, { unique: true, ...bg }),
  ]);

  const guardrail = database.collection(COLLECTIONS.GUARDRAIL_EVENTS);
  await Promise.allSettled([
    guardrail.createIndex({ timestamp: -1 }, bg),
  ]);
}

export async function getCollection<T extends Document>(name: string): Promise<Collection<T>> {
  const database = await connectDB();
  return database.collection<T>(name);
}

// shared alerts cache via globalThis so it survives Next.js per-route bundling
interface AlertsCache {
  alerts: Record<string, unknown>[];
  fetchedAt: number;
  promise: Promise<Record<string, unknown>[]> | null;
}

const ALERTS_CACHE_TTL_MS = 10_000;

function getAlertsCache(): AlertsCache {
  const g = globalThis as typeof globalThis & { __rangerAlertsCache?: AlertsCache };
  if (!g.__rangerAlertsCache) {
    g.__rangerAlertsCache = { alerts: [], fetchedAt: 0, promise: null };
  }
  return g.__rangerAlertsCache;
}

export async function getCachedAlerts(limit = 1000): Promise<Record<string, unknown>[]> {
  const cache = getAlertsCache();

  if (cache.alerts.length > 0 && Date.now() - cache.fetchedAt < ALERTS_CACHE_TTL_MS) {
    return cache.alerts;
  }

  if (cache.promise) return cache.promise;

  cache.promise = (async () => {
    try {
      const col = await getCollection(COLLECTIONS.ALERTS);
      const docs = await col.find({}).sort({ dispatchedAt: -1 }).limit(limit).toArray();
      cache.alerts = docs as unknown as Record<string, unknown>[];
      cache.fetchedAt = Date.now();
      return cache.alerts;
    } finally {
      cache.promise = null;
    }
  })();

  return cache.promise;
}
