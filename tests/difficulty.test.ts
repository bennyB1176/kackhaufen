import { describe, it, expect } from "vitest";
import {
  sizeForLevel,
  speedForLevel,
  hideChanceForLevel,
} from "../src/game/difficulty";
import {
  BASE_SIZE,
  MIN_SIZE,
  BASE_SPEED,
  MAX_SPEED,
  BASE_HIDE_CHANCE,
  MAX_HIDE_CHANCE,
} from "../src/game/config";

describe("difficulty", () => {
  it("Level 0 liefert die Basiswerte", () => {
    expect(sizeForLevel(0)).toBe(BASE_SIZE);
    expect(speedForLevel(0)).toBe(BASE_SPEED);
    expect(hideChanceForLevel(0)).toBe(BASE_HIDE_CHANCE);
  });

  it("höheres Level => kleiner und schneller", () => {
    expect(sizeForLevel(3)).toBeLessThan(sizeForLevel(1));
    expect(speedForLevel(3)).toBeGreaterThan(speedForLevel(1));
  });

  it("höheres Level => höhere Versteck-Chance", () => {
    expect(hideChanceForLevel(3)).toBeGreaterThan(hideChanceForLevel(1));
  });

  it("Größe wird nie kleiner als MIN_SIZE", () => {
    expect(sizeForLevel(9999)).toBe(MIN_SIZE);
  });

  it("Geschwindigkeit wird bei MAX_SPEED gedeckelt", () => {
    expect(speedForLevel(9999)).toBe(MAX_SPEED);
  });

  it("Versteck-Chance wird bei MAX_HIDE_CHANCE gedeckelt", () => {
    expect(hideChanceForLevel(9999)).toBe(MAX_HIDE_CHANCE);
  });
});
