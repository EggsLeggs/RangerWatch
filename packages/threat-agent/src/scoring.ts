import type { ClassifiedSighting } from "@rangerwatch/shared";

export const WEIGHT_OUT_OF_RANGE = 40;
export const WEIGHT_NOCTURNAL = 20;
export const WEIGHT_ENDANGERED_SPECIES = 25;
export const WEIGHT_INVASIVE_FIRST_APPEARANCE = 15;

const seenSpecies = new Set<string>();

export function zoneKey(species: string, lat: number, lng: number): string {
  return `${species}:${Math.floor(lat * 10) / 10}:${Math.floor(lng * 10) / 10}`;
}

export function hasSeen(species: string, lat: number, lng: number): boolean {
  return seenSpecies.has(zoneKey(species, lat, lng));
}

export function markSeen(species: string, lat: number, lng: number): void {
  seenSpecies.add(zoneKey(species, lat, lng));
}

export function isNocturnal(observedAt: Date, lng: number): boolean {
  try {
    const utcHour = observedAt.getUTCHours();
    const offsetHours = Math.round(lng / 15);
    const localHour = ((utcHour + offsetHours) % 24 + 24) % 24;
    return localHour >= 19 || localHour < 6;
  } catch {
    return false;
  }
}

export function scoreSighting(
  sighting: ClassifiedSighting,
  context: { inRange: boolean; iucnStatus: string | null; previouslySeen: boolean }
): number {
  let score = 0;
  if (!context.inRange) score += WEIGHT_OUT_OF_RANGE;
  if (isNocturnal(sighting.observedAt, sighting.lng)) score += WEIGHT_NOCTURNAL;
  if (context.iucnStatus === "EN" || context.iucnStatus === "CR") score += WEIGHT_ENDANGERED_SPECIES;
  if (sighting.invasive && !context.previouslySeen) score += WEIGHT_INVASIVE_FIRST_APPEARANCE;
  return Math.min(100, Math.max(0, score));
}
