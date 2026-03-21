import { describe, it, expect } from "bun:test";
import type { BoundingBox, ClassifiedSighting } from "@rangerwatch/shared";
import { isInRange, validateRange } from "./range.js";

const baseSighting: ClassifiedSighting = {
  id: "test-1",
  source: "inaturalist",
  imageUrl: "https://example.com/img.jpg",
  lat: 0,
  lng: 0,
  observedAt: new Date(),
  species: "unknown",
  confidence: 0.9,
  invasive: false,
  taxonId: null,
  needsReview: false,
};

const bounds: BoundingBox = {
  swLat: -10,
  swLng: -10,
  neLat: 10,
  neLng: 10,
};

describe("isInRange", () => {
  it("returns true when the point is inside the bounding box", () => {
    const sighting = { ...baseSighting, lat: 5, lng: 5 };
    expect(isInRange(sighting, bounds)).toBe(true);
  });

  it("returns false when the point is outside the bounding box", () => {
    const sighting = { ...baseSighting, lat: 50, lng: 50 };
    expect(isInRange(sighting, bounds)).toBe(false);
  });
});

describe("validateRange", () => {
  it("returns inRange: true and bounds: null when range data is unavailable", async () => {
    // species "unknown" causes getRangeBounds to return null
    const sighting = { ...baseSighting, species: "unknown" };
    const result = await validateRange(sighting);
    expect(result).toEqual({ inRange: true, bounds: null });
  });
});
