import { EventEmitter } from "node:events";
import type { Sighting } from "@rangerwatch/shared";

export const AGENT_NEW_SIGHTINGS = "agent:new-sightings" as const;

export interface NewSightingsPayload {
  sightings: Sighting[];
  enqueuedAt: Date;
}

export interface IngestEventMap {
  [AGENT_NEW_SIGHTINGS]: [NewSightingsPayload];
}

class IngestEventEmitter extends EventEmitter<IngestEventMap> {}

export const ingestEvents = new IngestEventEmitter();
