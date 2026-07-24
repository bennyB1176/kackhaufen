import type { GameState } from "./types";
import { CAPTAIN_BONUS, COMBO_STEP, MAX_MULTIPLIER } from "./config";

/**
 * Punkte-Multiplikator aus der aktuellen Combo (Treffer in Folge):
 * beginnt bei x1 und steigt alle COMBO_STEP Treffer um 1, gedeckelt bei
 * MAX_MULTIPLIER.
 */
export function comboMultiplier(combo: number): number {
  const raw = 1 + Math.floor(combo / COMBO_STEP);
  return Math.min(Math.max(1, raw), MAX_MULTIPLIER);
}

/**
 * Treffer: Combo erhöhen und Punkte gutschreiben.
 * Punkte = Basiswert (Kapitäns-Haufen = CAPTAIN_BONUS, sonst 1) × Multiplikator.
 */
export function applyHit(state: GameState): void {
  state.combo += 1;
  if (state.combo > state.bestCombo) state.bestCombo = state.combo;
  const base = state.poop.captain ? CAPTAIN_BONUS : 1;
  state.score += base * comboMultiplier(state.combo);
}

/**
 * Fehltreffer: Combo zurücksetzen und einen Punkt abziehen – aber nie unter 0.
 * Wer keine Punkte hat, verliert auch keine.
 */
export function applyMiss(state: GameState): void {
  state.combo = 0;
  state.score = Math.max(0, state.score - 1);
}
