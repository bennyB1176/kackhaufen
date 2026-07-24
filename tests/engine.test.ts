import { describe, it, expect } from "vitest";
import { createGame, update, handleTap, restartGame } from "../src/game/engine";
import type { Obstacle } from "../src/game/types";
import { ROUND_TIME } from "../src/game/config";

const world = { width: 1280, height: 720 };

describe("engine", () => {
  it("startet mit Punktestand 0 und Level 0", () => {
    const s = createGame(world);
    expect(s.score).toBe(0);
    expect(s.level).toBe(0);
    expect(s.poop).toBeDefined();
  });

  it("startet in Phase 'playing' mit voller Rundenzeit und Combo 0", () => {
    const s = createGame(world);
    expect(s.phase).toBe("playing");
    expect(s.timeLeft).toBe(ROUND_TIME);
    expect(s.combo).toBe(0);
    expect(s.bestCombo).toBe(0);
  });

  it("Treffer: +1 Punkt, Level steigt, neuer Kackhaufen ist kleiner und schneller", () => {
    const s = createGame(world);
    const oldSize = s.poop.size;
    const oldSpeed = Math.abs(s.poop.vx);
    const res = handleTap(s, s.poop.x, s.poop.y);
    expect(res).toBe("hit");
    expect(s.score).toBe(1);
    expect(s.level).toBe(1);
    expect(s.poop.size).toBeLessThan(oldSize);
    expect(Math.abs(s.poop.vx)).toBeGreaterThan(oldSpeed);
  });

  it("Treffer löst eine Umfall-Animation und Sternchen aus", () => {
    const s = createGame(world);
    handleTap(s, s.poop.x, s.poop.y);
    expect(s.falling.length).toBe(1);
    expect(s.stars.length).toBeGreaterThan(0);
  });

  it("Fehltreffer bei Level 0: -1 Punkt (mit 0-Grenze), Level bleibt 0", () => {
    const s = createGame(world);
    s.score = 2;
    const farX = s.poop.x + s.poop.size; // klar daneben
    const res = handleTap(s, farX, s.poop.y);
    expect(res).toBe("miss");
    expect(s.score).toBe(1);
    expect(s.level).toBe(0);
  });

  it("Fehltreffer bei 0 Punkten bleibt bei 0", () => {
    const s = createGame(world);
    const farX = s.poop.x + s.poop.size;
    handleTap(s, farX, s.poop.y);
    expect(s.score).toBe(0);
  });

  it("Fehltreffer bei Level > 0: Level sinkt, Kackhaufen wird größer und langsamer", () => {
    const s = createGame(world);
    handleTap(s, s.poop.x, s.poop.y); // Treffer -> Level 1
    handleTap(s, s.poop.x, s.poop.y); // Treffer -> Level 2
    expect(s.level).toBe(2);
    const sizeAtLevel2 = s.poop.size;
    const speedAtLevel2 = Math.abs(s.poop.vx);

    const farX = s.poop.x + s.poop.size; // klar daneben
    const res = handleTap(s, farX, s.poop.y);

    expect(res).toBe("miss");
    expect(s.level).toBe(1);
    expect(s.poop.size).toBeGreaterThan(sizeAtLevel2);
    expect(Math.abs(s.poop.vx)).toBeLessThan(speedAtLevel2);
  });

  it("Tap auf einen verdeckten Kackhaufen zählt als Fehltreffer", () => {
    const s = createGame(world);
    s.score = 5;
    // Objekt exakt über den Kackhaufen legen
    const cover: Obstacle = {
      x: s.poop.x - s.poop.size / 2,
      y: s.poop.y - s.poop.size,
      width: s.poop.size,
      height: s.poop.size * 1.5,
      kind: "bush",
    };
    s.obstacles = [cover];
    const res = handleTap(s, s.poop.x, s.poop.y);
    expect(res).toBe("miss");
    expect(s.score).toBe(4);
    expect(s.level).toBe(0);
  });

  it("update bewegt den Kackhaufen und baut Animationen ab", () => {
    const s = createGame(world);
    const startX = s.poop.x;
    handleTap(s, s.poop.x, s.poop.y); // erzeugt falling + stars
    const starsBefore = s.stars.length;
    update(s, 0.1);
    expect(s.poop.x).not.toBe(startX);
    // Sternchen verlieren Lebenszeit und verschwinden irgendwann
    update(s, 5);
    expect(s.stars.length).toBeLessThan(starsBefore);
    expect(s.falling.length).toBe(0);
  });

  it("update zählt die Rundenzeit herunter", () => {
    const s = createGame(world);
    update(s, 1);
    expect(s.timeLeft).toBeCloseTo(ROUND_TIME - 1);
    expect(s.phase).toBe("playing");
  });

  it("bei abgelaufener Zeit wechselt die Phase auf 'gameover'", () => {
    const s = createGame(world);
    update(s, ROUND_TIME + 1);
    expect(s.timeLeft).toBe(0);
    expect(s.phase).toBe("gameover");
  });

  it("im Game-Over-Zustand hat ein Tap keine Wirkung", () => {
    const s = createGame(world);
    s.phase = "gameover";
    s.score = 7;
    const res = handleTap(s, s.poop.x, s.poop.y); // säße sonst ein Treffer
    expect(res).toBe("miss");
    expect(s.score).toBe(7);
    expect(s.level).toBe(0);
  });

  it("erzeugt bei kleinem Zufallswert einen Kapitäns-Kackhaufen (ab Level 1)", () => {
    const s = createGame(world, () => 0.99); // Start-Poop nie Kapitän
    expect(s.poop.captain).toBe(false);
    handleTap(s, s.poop.x, s.poop.y, () => 0); // Treffer -> Level 1, Kapitän
    expect(s.level).toBe(1);
    expect(s.poop.captain).toBe(true);
  });

  it("restartGame setzt Zeit, Phase, Punkte, Level und Combo zurück", () => {
    const s = createGame(world);
    handleTap(s, s.poop.x, s.poop.y); // Punkte + Level + Combo hoch
    update(s, ROUND_TIME + 1); // Runde beenden
    expect(s.phase).toBe("gameover");

    restartGame(s);
    expect(s.phase).toBe("playing");
    expect(s.timeLeft).toBe(ROUND_TIME);
    expect(s.score).toBe(0);
    expect(s.level).toBe(0);
    expect(s.combo).toBe(0);
  });
});
