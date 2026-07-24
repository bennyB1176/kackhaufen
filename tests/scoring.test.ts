import { describe, it, expect } from "vitest";
import { applyHit, applyMiss, comboMultiplier } from "../src/game/scoring";
import { createGame } from "../src/game/engine";
import { CAPTAIN_BONUS, COMBO_STEP, MAX_MULTIPLIER } from "../src/game/config";

const world = { width: 1280, height: 720 };

describe("scoring", () => {
  it("Treffer erhöht den Punktestand um 1", () => {
    const s = createGame(world);
    applyHit(s);
    expect(s.score).toBe(1);
    applyHit(s);
    expect(s.score).toBe(2);
  });

  it("Fehltreffer zieht einen Punkt ab, wenn Punkte vorhanden sind", () => {
    const s = createGame(world);
    s.score = 3;
    applyMiss(s);
    expect(s.score).toBe(2);
  });

  it("Fehltreffer bei 0 Punkten bleibt bei 0 (kein Minus)", () => {
    const s = createGame(world);
    expect(s.score).toBe(0);
    applyMiss(s);
    expect(s.score).toBe(0);
  });

  describe("comboMultiplier", () => {
    it("beginnt bei x1 und steigt alle COMBO_STEP Treffer", () => {
      expect(comboMultiplier(0)).toBe(1);
      expect(comboMultiplier(COMBO_STEP - 1)).toBe(1);
      expect(comboMultiplier(COMBO_STEP)).toBe(2);
      expect(comboMultiplier(COMBO_STEP * 2)).toBe(3);
    });

    it("ist bei MAX_MULTIPLIER gedeckelt", () => {
      expect(comboMultiplier(COMBO_STEP * 100)).toBe(MAX_MULTIPLIER);
    });
  });

  it("Combo erhöht den Punktegewinn pro Treffer (Multiplikator)", () => {
    const s = createGame(world);
    s.combo = COMBO_STEP - 1; // nächster Treffer erreicht Combo COMBO_STEP -> x2
    const before = s.score;
    applyHit(s);
    expect(s.combo).toBe(COMBO_STEP); // Combo COMBO_STEP -> Multiplikator 2
    expect(s.score - before).toBe(2); // 1 Basispunkt × Multiplikator 2
  });

  it("merkt sich die höchste Combo (bestCombo)", () => {
    const s = createGame(world);
    applyHit(s);
    applyHit(s);
    expect(s.bestCombo).toBe(2);
    applyMiss(s);
    applyHit(s);
    expect(s.combo).toBe(1);
    expect(s.bestCombo).toBe(2); // bleibt beim bisherigen Maximum
  });

  it("Kapitäns-Kackhaufen gibt den Bonus mal Multiplikator", () => {
    const s = createGame(world);
    s.poop.captain = true;
    applyHit(s); // Combo 1 -> Multiplikator 1
    expect(s.score).toBe(CAPTAIN_BONUS * 1);
  });

  it("Fehltreffer setzt die Combo zurück", () => {
    const s = createGame(world);
    applyHit(s);
    applyHit(s);
    expect(s.combo).toBe(2);
    applyMiss(s);
    expect(s.combo).toBe(0);
  });
});
