import { describe, it, expect } from "vitest";
import { computeView, screenToWorld } from "../src/input/pointer";

const world = { width: 1280, height: 720 };

describe("pointer/view", () => {
  it("skaliert die Welt ohne Verzerrung (gleiches Seitenverhältnis)", () => {
    const view = computeView(world, 2560, 1440);
    expect(view.scale).toBe(2);
    expect(view.offsetX).toBe(0);
    expect(view.offsetY).toBe(0);
  });

  it("zentriert mit Letterbox, wenn die Canvas breiter ist", () => {
    const view = computeView(world, 1280 * 2, 720); // doppelt so breit
    expect(view.scale).toBe(1);
    expect(view.offsetX).toBe(640); // links/rechts Balken
    expect(view.offsetY).toBe(0);
  });

  it("screenToWorld ist die Umkehrung der Transformation", () => {
    const view = computeView(world, 2560, 1440);
    const p = screenToWorld(view, 1280, 720);
    expect(p.x).toBeCloseTo(640);
    expect(p.y).toBeCloseTo(360);
  });
});
