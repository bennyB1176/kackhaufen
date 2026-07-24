import type { Poop, World } from "./types";
import { GROUND_HEIGHT } from "./config";
import { sizeForLevel, speedForLevel } from "./difficulty";

/** Y-Position (Mittelpunkt) des Kackhaufens, sodass er auf dem Boden steht. */
export function groundY(world: World, size: number): number {
  return world.height - GROUND_HEIGHT - size / 2 + size * 0.15;
}

/** Neuen Kackhaufen am linken Rand erzeugen, laufend nach rechts. */
export function spawnPoop(level: number, world: World): Poop {
  const size = sizeForLevel(level);
  return {
    x: size / 2 + 10,
    y: groundY(world, size),
    vx: speedForLevel(level), // positiv => nach rechts
    size,
    walk: 0,
  };
}

/**
 * Bewegt den Kackhaufen einen Zeitschritt weiter und lässt ihn an den
 * Rändern umkehren. Die Lauf-Phase treibt die Bein-Animation an.
 */
export function updatePoop(poop: Poop, dt: number, world: World): void {
  poop.x += poop.vx * dt;

  const half = poop.size / 2;
  if (poop.x - half <= 0) {
    poop.x = half;
    poop.vx = Math.abs(poop.vx);
  } else if (poop.x + half >= world.width) {
    poop.x = world.width - half;
    poop.vx = -Math.abs(poop.vx);
  }

  // Lauf-Phase proportional zur zurückgelegten Strecke.
  poop.walk = (poop.walk + Math.abs(poop.vx) * dt * 0.012) % 1;
}
