import type { Poop, Obstacle } from "./types";

/**
 * Trefferprüfung: liegt der Tap innerhalb des runden tappbaren Bereichs?
 * Der Radius entspricht der halben aktuellen Größe – kleinere Kackhaufen
 * sind dadurch automatisch schwerer zu treffen.
 */
export function isTapOnPoop(poop: Poop, x: number, y: number): boolean {
  const radius = poop.size / 2;
  const dx = x - poop.x;
  const dy = y - poop.y;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * Ist der Kackhaufen gerade hinter einem Objekt versteckt?
 * Verdeckt = ein Objekt liegt über seinem Mittelpunkt und deckt seinen
 * oberen Bereich ab. In diesem Fall ist er nicht tappbar.
 */
export function isPoopCovered(poop: Poop, obstacles: Obstacle[]): boolean {
  const topOfPoop = poop.y - poop.size / 2;
  return obstacles.some((o) => {
    const horizontallyOver = poop.x >= o.x && poop.x <= o.x + o.width;
    const verticallyOver = o.y <= poop.y && o.y + o.height >= topOfPoop;
    return horizontallyOver && verticallyOver;
  });
}
