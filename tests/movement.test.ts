import { describe, it, expect } from "vitest";
import { pickMode, startMotion, updateMovement } from "../src/game/movement";
import { spawnPoop, groundY } from "../src/game/poop";
import { isPoopCovered } from "../src/game/collision";
import { makeObstacles } from "../src/game/engine";
import type { Obstacle, Poop } from "../src/game/types";
import { PEEK_OUT_TIME } from "../src/game/config";

const world = { width: 1280, height: 720 };

/** Zufall, der immer denselben Wert liefert – macht die Tests deterministisch. */
const fixed = (value: number) => () => value;

/** Kackhaufen mit gesetzter Bewegungsart erzeugen. */
function makePoop(level: number, obstacles: Obstacle[], r: number): Poop {
  const poop = spawnPoop(level, world, fixed(r));
  startMotion(poop, level, world, obstacles, fixed(r));
  return poop;
}

/** Lässt die Zeit in kleinen Schritten laufen. */
function simulate(
  poop: Poop,
  obstacles: Obstacle[],
  level: number,
  seconds: number,
  rng: () => number = fixed(0.2),
  onStep?: (p: Poop) => void,
): void {
  const dt = 1 / 60;
  for (let t = 0; t < seconds; t += dt) {
    updateMovement(poop, dt, world, obstacles, level, rng);
    onStep?.(poop);
  }
}

describe("movement", () => {
  describe("pickMode", () => {
    it("bleibt auf Level 0 immer beim ruhigen Laufen", () => {
      for (const r of [0, 0.3, 0.5, 0.9, 0.99]) {
        expect(pickMode(0, true, fixed(r))).toBe("walk");
      }
    });

    it("wählt nie 'peek', wenn es keine Objekte gibt", () => {
      for (const r of [0, 0.2, 0.5, 0.8, 0.99]) {
        expect(pickMode(5, false, fixed(r))).not.toBe("peek");
      }
    });

    it("nutzt ab Level 2 mit Objekten alle Bewegungsarten", () => {
      const modes = new Set(
        [0.1, 0.4, 0.7, 0.9].map((r) => pickMode(3, true, fixed(r))),
      );
      expect(modes).toEqual(new Set(["walk", "hop", "dash", "peek"]));
    });
  });

  describe("Spawn-Position", () => {
    it("startet mal links, mal rechts", () => {
      const left = makePoop(1, [], 0.2); // rng < 0.5 -> von links
      const right = makePoop(1, [], 0.8); // rng >= 0.5 -> von rechts
      expect(left.x).toBeLessThan(world.width / 2);
      expect(left.vx).toBeGreaterThan(0);
      expect(right.x).toBeGreaterThan(world.width / 2);
      expect(right.vx).toBeLessThan(0);
    });
  });

  describe("hop (Hüpfen)", () => {
    it("hebt vom Boden ab und landet wieder darauf", () => {
      const poop = makePoop(1, [], 0.8); // rng 0.8 auf Level 1 -> hop
      expect(poop.mode).toBe("hop");
      const ground = groundY(world, poop.size);

      let highest = ground;
      simulate(poop, [], 1, 2, fixed(0.8), (p) => {
        highest = Math.min(highest, p.y);
      });

      expect(highest).toBeLessThan(ground - 20); // war deutlich in der Luft
      expect(poop.y).toBeLessThanOrEqual(ground + 0.001); // nie unter den Boden
    });
  });

  describe("dash (Flitzen)", () => {
    it("wechselt zwischen Sprint und Verschnaufpause", () => {
      const poop = makePoop(3, [], 0.8); // rng 0.8 ohne Objekte -> dash
      expect(poop.mode).toBe("dash");

      const speeds = new Set<string>();
      simulate(poop, [], 3, 3, fixed(0.8), (p) => {
        speeds.add(p.vx === 0 ? "pause" : "sprint");
      });
      expect(speeds).toEqual(new Set(["sprint", "pause"]));
    });
  });

  describe("peek (hinter Objekten hervorlugen)", () => {
    const level = 5;
    const obstacles = makeObstacles(level, world);

    it("stellt sich für das Versteckspiel an ein Objekt und ist zuerst sichtbar", () => {
      expect(obstacles.length).toBeGreaterThan(0);
      const poop = makePoop(level, obstacles, 0.9); // rng 0.9 -> peek
      expect(poop.mode).toBe("peek");
      expect(poop.peekPhase).toBe("out");
      expect(poop.anchor).toBeGreaterThanOrEqual(0);
      // Startet sichtbar/tappbar, taucht nie unsichtbar auf.
      expect(isPoopCovered(poop, obstacles)).toBe(false);
    });

    it("verschwindet nach der Sichtbar-Zeit hinter dem Objekt", () => {
      const poop = makePoop(level, obstacles, 0.9);
      expect(isPoopCovered(poop, obstacles)).toBe(false);

      // Er bleibt zunächst die volle Sichtbar-Zeit tappbar ...
      simulate(poop, obstacles, level, PEEK_OUT_TIME * 0.9, fixed(0.2));
      expect(isPoopCovered(poop, obstacles)).toBe(false);

      // ... und ist danach hinter dem Objekt verschwunden (nicht tappbar).
      let hiddenAndCovered = false;
      simulate(poop, obstacles, level, PEEK_OUT_TIME, fixed(0.2), (p) => {
        if (p.peekPhase === "hiding" && isPoopCovered(p, obstacles)) {
          hiddenAndCovered = true;
        }
      });
      expect(hiddenAndCovered).toBe(true);
    });

    it("lugt danach wieder hervor und ist erneut tappbar", () => {
      const poop = makePoop(level, obstacles, 0.9);
      let wasHidden = false;
      let visibleAgainAfterHiding = false;

      simulate(poop, obstacles, level, 8, fixed(0.2), (p) => {
        const covered = isPoopCovered(p, obstacles);
        if (covered) wasHidden = true;
        else if (wasHidden) visibleAgainAfterHiding = true;
      });

      expect(wasHidden).toBe(true);
      expect(visibleAgainAfterHiding).toBe(true);
    });

    it("wechselt das Versteck, wenn es mehrere Objekte gibt", () => {
      const many = makeObstacles(12, world); // hohes Level => mehrere Objekte
      expect(many.length).toBeGreaterThan(1);

      const poop = makePoop(12, many, 0.9);
      const firstAnchor = poop.anchor;
      const seen = new Set<number>([firstAnchor]);
      simulate(poop, many, 12, 12, fixed(0.9), (p) => {
        seen.add(p.anchor);
      });
      expect(seen.size).toBeGreaterThan(1);
    });

    it("läuft ohne gültiges Versteck einfach normal weiter", () => {
      const poop = makePoop(level, obstacles, 0.9);
      poop.anchor = 99; // Objekt existiert nicht (mehr)
      poop.vx = 200;
      const startX = poop.x;
      simulate(poop, obstacles, level, 0.5, fixed(0.2));
      expect(poop.x).not.toBe(startX); // bewegt sich trotzdem
    });
  });
});
