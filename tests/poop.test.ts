import { describe, it, expect } from "vitest";
import { spawnPoop, updatePoop, relaxPoop } from "../src/game/poop";
import { speedForLevel, sizeForLevel } from "../src/game/difficulty";

const world = { width: 1280, height: 720 };

describe("poop", () => {
  it("startet mit Größe und Tempo passend zum Level und läuft nach rechts", () => {
    const p = spawnPoop(0, world);
    expect(p.size).toBe(sizeForLevel(0));
    expect(Math.abs(p.vx)).toBe(speedForLevel(0));
    expect(p.vx).toBeGreaterThan(0); // läuft von links nach rechts
    expect(p.x).toBeGreaterThan(0);
  });

  it("bewegt sich pro Update in vx-Richtung", () => {
    const p = spawnPoop(0, world);
    const startX = p.x;
    updatePoop(p, 0.1, world);
    expect(p.x).toBeGreaterThan(startX);
  });

  it("dreht am rechten Rand um", () => {
    const p = spawnPoop(0, world);
    p.x = world.width - p.size / 2 - 1;
    p.vx = Math.abs(p.vx);
    updatePoop(p, 1, world); // großer Schritt über den Rand hinaus
    expect(p.vx).toBeLessThan(0);
    expect(p.x + p.size / 2).toBeLessThanOrEqual(world.width);
  });

  it("dreht am linken Rand um", () => {
    const p = spawnPoop(0, world);
    p.x = p.size / 2 + 1;
    p.vx = -Math.abs(p.vx);
    updatePoop(p, 1, world);
    expect(p.vx).toBeGreaterThan(0);
    expect(p.x - p.size / 2).toBeGreaterThanOrEqual(0);
  });

  it("advanciert die Lauf-Phase (Beine bewegen sich)", () => {
    const p = spawnPoop(0, world);
    const w0 = p.walk;
    updatePoop(p, 0.2, world);
    expect(p.walk).not.toBe(w0);
  });

  describe("relaxPoop (Fehltreffer macht den Kackhaufen wieder leichter)", () => {
    it("passt Größe und Tempo an ein niedrigeres Level an, ohne die Position zurückzusetzen", () => {
      const p = spawnPoop(3, world);
      const x = 640;
      p.x = x;
      relaxPoop(p, 1, world);
      expect(p.size).toBe(sizeForLevel(1));
      expect(Math.abs(p.vx)).toBe(speedForLevel(1));
      expect(p.x).toBe(x); // Position bleibt, kein Reset an den Rand
    });

    it("behält die Laufrichtung (Vorzeichen von vx) bei", () => {
      const p = spawnPoop(3, world);
      p.vx = -Math.abs(p.vx); // nach links laufend
      relaxPoop(p, 1, world);
      expect(p.vx).toBeLessThan(0);
    });

    it("klemmt die Position, falls die neue (größere) Größe über den Rand ragen würde", () => {
      const p = spawnPoop(5, world); // klein, nah am Rand möglich
      p.x = sizeForLevel(5) / 2 + 1; // knapp am linken Rand
      relaxPoop(p, 0, world); // deutlich größer
      const half = sizeForLevel(0) / 2;
      expect(p.x).toBeGreaterThanOrEqual(half);
    });
  });
});
