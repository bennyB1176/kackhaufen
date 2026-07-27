import { describe, it, expect } from "vitest";
import { isTapOnPoop, isPoopCovered } from "../src/game/collision";
import { spawnPoop } from "../src/game/poop";
import type { Poop, Obstacle } from "../src/game/types";

/** Baut einen Kackhaufen an fester Position (nutzt den echten Spawn als Basis). */
function poopAt(x: number, y: number, size = 180): Poop {
  const p = spawnPoop(0, { width: 1280, height: 720 }, () => 0.2);
  return { ...p, x, y, size, vx: 100 };
}

describe("collision", () => {
  it("Tap im Zentrum trifft", () => {
    const p = poopAt(500, 600);
    expect(isTapOnPoop(p, 500, 600)).toBe(true);
  });

  it("Tap knapp innerhalb des Radius trifft", () => {
    const p = poopAt(500, 600, 180);
    expect(isTapOnPoop(p, 500 + 80, 600)).toBe(true);
  });

  it("Tap außerhalb des Radius trifft nicht", () => {
    const p = poopAt(500, 600, 180);
    expect(isTapOnPoop(p, 500 + 200, 600)).toBe(false);
  });

  it("kleinerer Kackhaufen ist schwerer zu treffen", () => {
    const big = poopAt(500, 600, 180);
    const small = poopAt(500, 600, 80);
    const tapX = 500 + 70;
    expect(isTapOnPoop(big, tapX, 600)).toBe(true);
    expect(isTapOnPoop(small, tapX, 600)).toBe(false);
  });

  it("gilt als verdeckt, wenn ein Objekt über dem Zentrum liegt", () => {
    const p = poopAt(500, 600, 180);
    const obstacle: Obstacle = {
      x: 440,
      y: 500,
      width: 160,
      height: 220,
      kind: "bush",
    };
    expect(isPoopCovered(p, [obstacle])).toBe(true);
  });

  it("gilt nicht als verdeckt, wenn das Objekt woanders steht", () => {
    const p = poopAt(500, 600, 180);
    const obstacle: Obstacle = {
      x: 50,
      y: 500,
      width: 120,
      height: 220,
      kind: "bush",
    };
    expect(isPoopCovered(p, [obstacle])).toBe(false);
  });
});
