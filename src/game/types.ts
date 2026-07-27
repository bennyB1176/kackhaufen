export interface Vector {
  x: number;
  y: number;
}

export interface World {
  width: number;
  height: number;
}

/**
 * Art der Fortbewegung. Sorgt dafür, dass der Kackhaufen nicht immer nur
 * stumpf von links nach rechts läuft.
 */
export type MoveMode = "walk" | "hop" | "dash" | "peek";

/** Beim Versteckspiel: lugt er gerade hervor oder steckt er hinter dem Objekt? */
export type PeekPhase = "out" | "hiding";

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
  /**
   * Ist dies der seltene extra-stinkige Kapitäns-Kackhaufen (mit Mütze und
   * Duftwölkchen)? Ein Treffer bringt dann Bonuspunkte.
   */
  captain: boolean;
  /** Art der Fortbewegung */
  mode: MoveMode;
  /** Vertikale Geschwindigkeit in px/s (nur beim Hüpfen) */
  vy: number;
  /** Timer des aktuellen Bewegungsabschnitts in Sekunden (von allen Modi genutzt) */
  timer: number;
  /** Peek: Index des Hindernisses, hinter dem er sich versteckt (-1 = keins) */
  anchor: number;
  /** Peek: lugt er hervor oder ist er versteckt? */
  peekPhase: PeekPhase;
  /** Peek: auf welcher Seite des Hindernisses lugt er hervor (-1 links, 1 rechts) */
  peekSide: number;
}

/** Art des Deko-/Versteck-Objekts, das gezeichnet wird. */
export type ObstacleKind = "bush" | "stone" | "house";

export interface Obstacle {
  /** linke Kante */
  x: number;
  /** obere Kante */
  y: number;
  width: number;
  height: number;
  /** Art des Objekts (bestimmt die gezeichnete Form) */
  kind: ObstacleKind;
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

/** Phase des Spiels: laufende Runde oder Game-Over-Bildschirm. */
export type GamePhase = "playing" | "gameover";

export interface GameState {
  world: World;
  score: number;
  /** steigt mit jedem Treffer und steuert die Schwierigkeit */
  level: number;
  /** aktueller Spielzustand (Runde läuft oder vorbei) */
  phase: GamePhase;
  /** verbleibende Zeit der Runde in Sekunden */
  timeLeft: number;
  /** Treffer in Folge (steuert den Punkte-Multiplikator) */
  combo: number;
  /** höchste in dieser Runde erreichte Combo */
  bestCombo: number;
  poop: Poop;
  obstacles: Obstacle[];
  falling: FallingPoop[];
  stars: Star[];
}

export type TapResult = "hit" | "miss";
