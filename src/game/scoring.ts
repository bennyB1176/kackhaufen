import type { GameState } from "./types";

/** Treffer: ein Punkt dazu. */
export function applyHit(state: GameState): void {
  state.score += 1;
}

/**
 * Fehltreffer: ein Punkt weg – aber nie unter 0.
 * Wer keine Punkte hat, verliert auch keine.
 */
export function applyMiss(state: GameState): void {
  state.score = Math.max(0, state.score - 1);
}
