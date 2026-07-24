import {
  BASE_SIZE,
  MIN_SIZE,
  SIZE_SHRINK_PER_LEVEL,
  BASE_SPEED,
  MAX_SPEED,
  SPEED_GAIN_PER_LEVEL,
  BASE_HIDE_CHANCE,
  HIDE_CHANCE_PER_LEVEL,
  MAX_HIDE_CHANCE,
} from "./config";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Durchmesser des Kackhaufens für ein Level: schrumpft bis MIN_SIZE. */
export function sizeForLevel(level: number): number {
  return clamp(BASE_SIZE - level * SIZE_SHRINK_PER_LEVEL, MIN_SIZE, BASE_SIZE);
}

/** Laufgeschwindigkeit für ein Level: steigt bis MAX_SPEED. */
export function speedForLevel(level: number): number {
  return clamp(BASE_SPEED + level * SPEED_GAIN_PER_LEVEL, BASE_SPEED, MAX_SPEED);
}

/** Wahrscheinlichkeit, dass sich der Kackhaufen versteckt: steigt bis MAX_HIDE_CHANCE. */
export function hideChanceForLevel(level: number): number {
  return clamp(
    BASE_HIDE_CHANCE + level * HIDE_CHANCE_PER_LEVEL,
    BASE_HIDE_CHANCE,
    MAX_HIDE_CHANCE,
  );
}
