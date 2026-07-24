import { describe, it, expect } from "vitest";
import { applyHit, applyMiss } from "../src/game/scoring";
import { createGame } from "../src/game/engine";

describe("scoring", () => {
  it("Treffer erhöht den Punktestand um 1", () => {
    const s = createGame({ width: 1280, height: 720 });
    applyHit(s);
    expect(s.score).toBe(1);
    applyHit(s);
    expect(s.score).toBe(2);
  });

  it("Fehltreffer zieht einen Punkt ab, wenn Punkte vorhanden sind", () => {
    const s = createGame({ width: 1280, height: 720 });
    s.score = 3;
    applyMiss(s);
    expect(s.score).toBe(2);
  });

  it("Fehltreffer bei 0 Punkten bleibt bei 0 (kein Minus)", () => {
    const s = createGame({ width: 1280, height: 720 });
    expect(s.score).toBe(0);
    applyMiss(s);
    expect(s.score).toBe(0);
  });
});
