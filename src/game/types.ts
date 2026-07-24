export interface Vector {
  x: number;
  y: number;
}

export interface World {
  width: number;
  height: number;
}

export interface Poop {
  /** Mittelpunkt X in Spielkoordinaten */
  x: number;
  /** Mittelpunkt Y (Standhöhe auf dem Boden) */
  y: number;
  /** Horizontale Geschwindigkeit in px/s (Vorzeichen = Laufrichtung) */
  vx: number;
  /** Durchmesser des tappbaren Bereichs in px */
  size: number;
  /** Phase 0..1 für den Bein-Lauf-Zyklus */
  walk: number;
}

export interface Obstacle {
  /** linke Kante */
  x: number;
  /** obere Kante */
  y: number;
  width: number;
  height: number;
  /** Emoji, das als Deko/Versteck gezeichnet wird */
  emoji: string;
}

/** Ein umfallender Kackhaufen als reine Animations-Entität. */
export interface FallingPoop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  /** aktueller Drehwinkel in Radiant */
  rotation: number;
  /** Restlebenszeit in Sekunden */
  life: number;
}

/** Ein Sternchen-Partikel für den Treffer-Effekt. */
export interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface GameState {
  world: World;
  score: number;
  /** steigt mit jedem Treffer und steuert die Schwierigkeit */
  level: number;
  poop: Poop;
  obstacles: Obstacle[];
  falling: FallingPoop[];
  stars: Star[];
}

export type TapResult = "hit" | "miss";
