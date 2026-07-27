import type { MoveMode, Obstacle, Poop, World } from "./types";
import {
  HOP_INTERVAL,
  HOP_VELOCITY,
  HOP_GRAVITY,
  DASH_PAUSE,
  DASH_RUN_TIME,
  DASH_SPEED_FACTOR,
  PEEK_OUT_TIME,
  PEEK_HIDE_TIME,
  PEEK_SLIDE_SPEED,
  PEEK_MARGIN,
} from "./config";
import { groundY, updatePoop } from "./poop";
import { speedForLevel } from "./difficulty";

/**
 * Bewegungsarten des Kackhaufens. Damit läuft er nicht mehr stumpf immer
 * von links nach rechts, sondern hüpft, flitzt in Etappen oder spielt
 * Verstecken hinter den Objekten.
 *
 * Aller Zufall kommt über `rng` herein, damit die Logik testbar bleibt.
 */

/**
 * Wählt eine Bewegungsart passend zum Level: Level 0 bleibt bewusst ruhig,
 * Verstecken gibt es erst, wenn überhaupt Objekte dastehen.
 */
export function pickMode(
  level: number,
  hasObstacles: boolean,
  rng: () => number,
): MoveMode {
  if (level <= 0) return "walk";

  const r = rng();
  if (level === 1) return r < 0.6 ? "walk" : "hop";

  if (hasObstacles) {
    if (r < 0.35) return "walk";
    if (r < 0.6) return "hop";
    if (r < 0.8) return "dash";
    return "peek";
  }
  if (r < 0.4) return "walk";
  if (r < 0.75) return "hop";
  return "dash";
}

/** Mittelpunkt-X eines Objekts (dort ist der Kackhaufen komplett verdeckt). */
function hiddenX(o: Obstacle): number {
  return o.x + o.width / 2;
}

/**
 * Ziel-X zum Hervorlugen: knapp neben der Objektkante, sodass der
 * Mittelpunkt außerhalb des Objekts liegt und `isPoopCovered` ihn wieder
 * als tappbar meldet.
 */
function peekOutX(o: Obstacle, poop: Poop, side: number): number {
  const margin = poop.size * PEEK_MARGIN;
  return side < 0 ? o.x - margin : o.x + o.width + margin;
}

/** Wählt ein Objekt aus – möglichst ein anderes als das aktuelle. */
function pickAnchor(obstacles: Obstacle[], current: number, rng: () => number): number {
  if (obstacles.length <= 1) return 0;
  const others = obstacles.map((_, i) => i).filter((i) => i !== current);
  return others[Math.min(others.length - 1, Math.floor(rng() * others.length))];
}

/**
 * Wählt eine Seite zum Hervorlugen und dreht sie um, falls der Kackhaufen
 * dort aus der Welt ragen würde.
 */
function pickSide(
  o: Obstacle,
  poop: Poop,
  world: World,
  preferred: number,
): number {
  const half = poop.size / 2;
  const fits = (side: number): boolean => {
    const x = peekOutX(o, poop, side);
    return x - half >= 0 && x + half <= world.width;
  };
  if (fits(preferred)) return preferred;
  if (fits(-preferred)) return -preferred;
  return preferred;
}

/**
 * Setzt Bewegungsart und Startposition eines frisch erzeugten Kackhaufens.
 * Wird direkt nach `spawnPoop` aufgerufen (getrennt, damit `poop.ts` nichts
 * von den Bewegungsarten wissen muss).
 */
export function startMotion(
  poop: Poop,
  level: number,
  world: World,
  obstacles: Obstacle[],
  rng: () => number,
): void {
  const mode = pickMode(level, obstacles.length > 0, rng);
  poop.mode = mode;
  poop.vy = 0;
  poop.y = groundY(world, poop.size);

  if (mode === "peek" && obstacles.length > 0) {
    const anchor = Math.min(obstacles.length - 1, Math.floor(rng() * obstacles.length));
    const o = obstacles[anchor];
    const side = pickSide(o, poop, world, rng() < 0.5 ? -1 : 1);
    poop.anchor = anchor;
    poop.peekSide = side;
    // Startet immer sichtbar: er taucht nie aus dem Nichts unsichtbar auf.
    poop.peekPhase = "out";
    poop.timer = PEEK_OUT_TIME;
    poop.x = peekOutX(o, poop, side);
    poop.vx = Math.abs(poop.vx) * -side; // schaut zur offenen Seite
    return;
  }

  // Alle übrigen Modi starten an einem der beiden Ränder – mal links, mal rechts.
  const fromLeft = rng() < 0.5;
  const half = poop.size / 2;
  poop.x = fromLeft ? half + 10 : world.width - half - 10;
  poop.anchor = -1;
  poop.peekPhase = "out";

  const speed = speedForLevel(level);
  const direction = fromLeft ? 1 : -1;
  if (mode === "dash") {
    poop.vx = direction * speed * DASH_SPEED_FACTOR;
    poop.timer = DASH_RUN_TIME;
  } else {
    poop.vx = direction * speed;
    poop.timer = mode === "hop" ? HOP_INTERVAL : 0;
  }
}

/** Hüpfen: normale Laufbewegung plus Sprungbögen. */
function updateHop(poop: Poop, dt: number, world: World): void {
  const ground = groundY(world, poop.size);
  if (poop.y < ground || poop.vy < 0) {
    // in der Luft
    poop.vy += HOP_GRAVITY * dt;
    poop.y += poop.vy * dt;
    if (poop.y >= ground) {
      poop.y = ground;
      poop.vy = 0;
      poop.timer = HOP_INTERVAL;
    }
  } else {
    poop.timer -= dt;
    if (poop.timer <= 0) poop.vy = -HOP_VELOCITY;
  }
  updatePoop(poop, dt, world);
}

/** Flitzen: kurz stehen bleiben, dann ein Stück sprinten. */
function updateDash(poop: Poop, dt: number, world: World, level: number): void {
  poop.timer -= dt;
  if (poop.timer <= 0) {
    if (poop.vx !== 0) {
      poop.vx = 0; // Verschnaufpause
      poop.timer = DASH_PAUSE;
    } else {
      // In die Richtung starten, in der mehr Platz ist.
      const direction = poop.x < world.width / 2 ? 1 : -1;
      poop.vx = direction * speedForLevel(level) * DASH_SPEED_FACTOR;
      poop.timer = DASH_RUN_TIME;
    }
  }
  updatePoop(poop, dt, world);
}

/**
 * Verstecken: hinter einem Objekt hervorlugen, kurz sichtbar bleiben, wieder
 * verschwinden – und hinter einem anderen Objekt erneut auftauchen.
 * Die Sichtbarkeit ergibt sich allein aus der Position: steht der Mittelpunkt
 * über dem Objekt, meldet `isPoopCovered` ihn als nicht tappbar.
 */
function updatePeek(
  poop: Poop,
  dt: number,
  world: World,
  obstacles: Obstacle[],
  rng: () => number,
): void {
  const o = obstacles[poop.anchor];
  if (!o) {
    // Ohne gültiges Versteck einfach normal weiterlaufen.
    updatePoop(poop, dt, world);
    return;
  }

  const target =
    poop.peekPhase === "out"
      ? peekOutX(o, poop, poop.peekSide)
      : hiddenX(o);
  const dx = target - poop.x;

  if (Math.abs(dx) > 1) {
    // zum Ziel gleiten (Beinchen laufen mit)
    const step = Math.min(PEEK_SLIDE_SPEED * dt, Math.abs(dx));
    poop.x += Math.sign(dx) * step;
    poop.vx = Math.sign(dx) * PEEK_SLIDE_SPEED;
    poop.walk = (poop.walk + step * 0.012) % 1;
    return;
  }

  poop.x = target;
  poop.vx = 0;
  poop.timer -= dt;
  if (poop.timer > 0) return;

  if (poop.peekPhase === "out") {
    poop.peekPhase = "hiding";
    poop.timer = PEEK_HIDE_TIME;
    return;
  }

  // Fertig versteckt: unsichtbar zu einem anderen Objekt wechseln und dort
  // wieder hervorlugen.
  const anchor = pickAnchor(obstacles, poop.anchor, rng);
  const next = obstacles[anchor];
  poop.anchor = anchor;
  poop.peekSide = pickSide(next, poop, world, rng() < 0.5 ? -1 : 1);
  poop.peekPhase = "out";
  poop.timer = PEEK_OUT_TIME;
  poop.x = hiddenX(next); // Sprung passiert hinter dem Objekt, also unsichtbar
}

/** Bewegt den Kackhaufen gemäß seiner Bewegungsart einen Zeitschritt weiter. */
export function updateMovement(
  poop: Poop,
  dt: number,
  world: World,
  obstacles: Obstacle[],
  level: number,
  rng: () => number,
): void {
  switch (poop.mode) {
    case "hop":
      updateHop(poop, dt, world);
      return;
    case "dash":
      updateDash(poop, dt, world, level);
      return;
    case "peek":
      updatePeek(poop, dt, world, obstacles, rng);
      return;
    case "walk":
      updatePoop(poop, dt, world);
      return;
  }
}
