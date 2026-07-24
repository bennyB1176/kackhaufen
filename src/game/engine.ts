import type { GameState, World, Obstacle, TapResult } from "./types";
import {
  FALL_DURATION,
  FALL_GRAVITY,
  STAR_DURATION,
  STARS_PER_HIT,
  GROUND_HEIGHT,
} from "./config";
import { spawnPoop, updatePoop } from "./poop";
import { hideChanceForLevel } from "./difficulty";
import { isTapOnPoop, isPoopCovered } from "./collision";
import { applyHit, applyMiss } from "./scoring";

const OBSTACLE_EMOJIS = ["🌳", "📦", "🪨", "🌵", "🛢️"];

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
    const w = 130;
    const h = 230;
    const x = startX + gap * i + (gap - w) / 2;
    obstacles.push({
      x,
      y: world.height - GROUND_HEIGHT - h + 40,
      width: w,
      height: h,
      emoji: OBSTACLE_EMOJIS[i % OBSTACLE_EMOJIS.length],
    });
  }
  return obstacles;
}

export function createGame(world: World): GameState {
  return {
    world,
    score: 0,
    level: 0,
    poop: spawnPoop(0, world),
    obstacles: makeObstacles(0, world),
    falling: [],
    stars: [],
  };
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
 * Sonst => Fehltreffer (−1 Punkt, aber nie unter 0).
 */
export function handleTap(state: GameState, x: number, y: number): TapResult {
  const hit =
    isTapOnPoop(state.poop, x, y) && !isPoopCovered(state.poop, state.obstacles);

  if (!hit) {
    applyMiss(state);
    return "miss";
  }

  applyHit(state);
  launchFallingPoop(state);
  burstStars(state);
  state.level += 1;
  state.poop = spawnPoop(state.level, state.world);
  state.obstacles = makeObstacles(state.level, state.world);
  return "hit";
}

/** Bewegt die Welt einen Zeitschritt weiter (Sekunden). */
export function update(state: GameState, dt: number): void {
  updatePoop(state.poop, dt, state.world);

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
