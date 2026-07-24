import type { Poop, World } from "./types";
import { GROUND_HEIGHT, CAPTAIN_CHANCE } from "./config";
import { sizeForLevel, speedForLevel } from "./difficulty";

/** Y-Position (Mittelpunkt) des Kackhaufens, sodass er auf dem Boden steht. */
export function groundY(world: World, size: number): number {
  return world.height - GROUND_HEIGHT - size / 2 + size * 0.15;
}

/**
 * Neuen Kackhaufen am linken Rand erzeugen, laufend nach rechts.
 * Mit kleiner Wahrscheinlichkeit (ab Level 1) ist es der seltene, extra
 * stinkige Kapitäns-Kackhaufen. Der Zufall wird als `rng` hereingereicht,
 * damit die Spawn-Logik in Tests deterministisch bleibt.
 */
export function spawnPoop(
  level: number,
  world: World,
  rng: () => number = Math.random,
): Poop {
  const size = sizeForLevel(level);
  const captain = level > 0 && rng() < CAPTAIN_CHANCE;
  return {
    x: size / 2 + 10,
    y: groundY(world, size),
    vx: speedForLevel(level), // positiv => nach rechts
    size,
    walk: 0,
    captain,
  };
}

/**
 * Passt einen bereits laufenden Kackhaufen an ein (typischerweise
 * niedrigeres) Level an, ohne ihn an den Rand zurückzusetzen. Wird bei
 * einem Fehltreffer genutzt: der Kackhaufen wird dadurch sofort sichtbar
 * wieder etwas größer und langsamer. Laufrichtung bleibt erhalten; die
 * Position wird nur geklemmt, falls die neue Größe sonst über den Rand
 * ragen würde.
 */
export function relaxPoop(poop: Poop, level: number, world: World): void {
  const direction = Math.sign(poop.vx) || 1;
  const size = sizeForLevel(level);
  poop.size = size;
  poop.vx = speedForLevel(level) * direction;
  poop.y = groundY(world, size);
  const half = size / 2;
  poop.x = Math.min(Math.max(poop.x, half), world.width - half);
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
