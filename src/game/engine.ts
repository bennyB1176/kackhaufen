import type { GameState, World, Obstacle, ObstacleKind, TapResult } from "./types";
import {
  FALL_DURATION,
  FALL_GRAVITY,
  STAR_DURATION,
  STARS_PER_HIT,
  GROUND_HEIGHT,
  ROUND_TIME,
} from "./config";
import { spawnPoop, relaxPoop } from "./poop";
import { startMotion, updateMovement } from "./movement";
import { hideChanceForLevel, sizeForLevel } from "./difficulty";
import { isTapOnPoop, isPoopCovered } from "./collision";
import { applyHit, applyMiss } from "./scoring";

const OBSTACLE_KINDS: ObstacleKind[] = ["bush", "stone", "house"];

/**
 * Deko-Objekte, hinter denen sich der Kackhaufen verstecken kann.
 * Mit steigendem Level (höhere Versteck-Chance) werden es mehr.
 * Deterministisch, damit die Logik testbar bleibt.
 */
export function makeObstacles(level: number, world: World): Obstacle[] {
  const chance = hideChanceForLevel(level);
  const count = Math.min(4, Math.round(chance * 6));
  if (count <= 0) return [];

  const obstacles: Obstacle[] = [];
  const usable = world.width * 0.7;
  const startX = world.width * 0.18;
  const gap = usable / count;
  for (let i = 0; i < count; i++) {
    // Breit genug, dass der Kackhaufen dahinter wirklich verschwindet –
    // sonst schaut er heraus, obwohl er laut Logik nicht tappbar ist.
    const w = Math.max(150, sizeForLevel(level) * 1.15);
    const h = 230;
    const x = startX + gap * i + (gap - w) / 2;
    obstacles.push({
      x,
      y: world.height - GROUND_HEIGHT - h + 40,
      width: w,
      height: h,
      kind: OBSTACLE_KINDS[i % OBSTACLE_KINDS.length],
    });
  }
  return obstacles;
}

/**
 * Erzeugt den nächsten Kackhaufen samt Bewegungsart. Die Objekte müssen
 * vorher feststehen, damit er sich für das Versteckspiel hinter eines
 * stellen kann.
 */
function nextPoop(
  level: number,
  world: World,
  obstacles: Obstacle[],
  rng: () => number,
) {
  const poop = spawnPoop(level, world, rng);
  startMotion(poop, level, world, obstacles, rng);
  return poop;
}

export function createGame(
  world: World,
  rng: () => number = Math.random,
): GameState {
  const obstacles = makeObstacles(0, world);
  return {
    world,
    score: 0,
    level: 0,
    phase: "playing",
    timeLeft: ROUND_TIME,
    combo: 0,
    bestCombo: 0,
    poop: nextPoop(0, world, obstacles, rng),
    obstacles,
    falling: [],
    stars: [],
  };
}

/**
 * Startet eine neue Runde im selben State-Objekt (für den „Nochmal!"-Knopf):
 * Zeit, Punkte, Level, Combo und Phase werden zurückgesetzt.
 */
export function restartGame(
  state: GameState,
  rng: () => number = Math.random,
): void {
  Object.assign(state, createGame(state.world, rng));
}

/** Verwandelt den aktuellen Kackhaufen in einen lustig umfallenden. */
function launchFallingPoop(state: GameState): void {
  const p = state.poop;
  state.falling.push({
    x: p.x,
    y: p.y,
    vx: p.vx * 0.3,
    vy: -260, // erst ein kleiner Hüpfer nach oben ...
    size: p.size,
    rotation: 0,
    life: FALL_DURATION,
  });
}

/** Sternchen-Feuerwerk beim Treffer (deterministisch verteilt). */
function burstStars(state: GameState): void {
  const p = state.poop;
  for (let i = 0; i < STARS_PER_HIT; i++) {
    const angle = (i / STARS_PER_HIT) * Math.PI * 2;
    const speed = 320;
    state.stars.push({
      x: p.x,
      y: p.y - p.size * 0.2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: STAR_DURATION,
    });
  }
}

/**
 * Verarbeitet einen Tap.
 * Treffer (auf sichtbaren Kackhaufen) => +1 Punkt, schwerer, Animationen.
 * Fehltreffer => −1 Punkt (nie unter 0) und einen Schritt leichter: der
 * Kackhaufen wird wieder etwas größer und langsamer.
 */
export function handleTap(
  state: GameState,
  x: number,
  y: number,
  rng: () => number = Math.random,
): TapResult {
  // Nach dem Rundenende zählen Taps nicht mehr (der Game-Over-Screen liegt davor).
  if (state.phase !== "playing") return "miss";

  const hit =
    isTapOnPoop(state.poop, x, y) && !isPoopCovered(state.poop, state.obstacles);

  if (!hit) {
    applyMiss(state);
    state.level = Math.max(0, state.level - 1);
    relaxPoop(state.poop, state.level, state.world);
    state.obstacles = makeObstacles(state.level, state.world);
    return "miss";
  }

  applyHit(state);
  launchFallingPoop(state);
  burstStars(state);
  state.level += 1;
  // Erst die Objekte, dann der Kackhaufen – er braucht sie zum Verstecken.
  state.obstacles = makeObstacles(state.level, state.world);
  state.poop = nextPoop(state.level, state.world, state.obstacles, rng);
  return "hit";
}

/** Bewegt die Welt einen Zeitschritt weiter (Sekunden). */
export function update(
  state: GameState,
  dt: number,
  rng: () => number = Math.random,
): void {
  if (state.phase === "playing") {
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.phase = "gameover";
    }
    // Der Kackhaufen läuft nur während der Runde; nach Rundenende hält er an.
    updateMovement(
      state.poop,
      dt,
      state.world,
      state.obstacles,
      state.level,
      rng,
    );
  }

  for (const f of state.falling) {
    f.vy += FALL_GRAVITY * dt;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.rotation += 6 * dt;
    f.life -= dt;
  }
  state.falling = state.falling.filter((f) => f.life > 0);

  for (const s of state.stars) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vy += FALL_GRAVITY * 0.35 * dt;
    s.life -= dt;
  }
  state.stars = state.stars.filter((s) => s.life > 0);
}
