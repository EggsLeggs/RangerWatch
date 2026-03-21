import { describe, expect, test } from "bun:test";
import { ThreatLevel } from "@rangerwatch/shared";
import { classifyThreat } from "./classifier.js";

describe("classifyThreat", () => {
  test("score 85 returns CRITICAL", () => {
    expect(classifyThreat(85, "LC", true)).toBe(ThreatLevel.CRITICAL);
  });
  test("score 60 returns WARNING", () => {
    expect(classifyThreat(60, "LC", true)).toBe(ThreatLevel.WARNING);
  });
  test("score 20 returns INFO", () => {
    expect(classifyThreat(20, "LC", true)).toBe(ThreatLevel.INFO);
  });
  test("CR species out of range returns CRITICAL regardless of score", () => {
    expect(classifyThreat(10, "CR", false)).toBe(ThreatLevel.CRITICAL);
  });
});
