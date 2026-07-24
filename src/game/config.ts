/**
 * Zentrale Balancing-Werte. Alle Größen sind auf ein virtuelles
 * Querformat von 1280 x 720 Spielkoordinaten bezogen; das Rendering
 * skaliert auf die echte Bildschirmgröße.
 */
export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;

/** Höhe des Bodens, auf dem der Kackhaufen läuft (von unten gemessen). */
export const GROUND_HEIGHT = 120;

// --- Größe ---
export const BASE_SIZE = 180; // Startdurchmesser bei level 0
export const MIN_SIZE = 70; // so klein wird er höchstens
export const SIZE_SHRINK_PER_LEVEL = 9; // px pro Treffer kleiner

// --- Geschwindigkeit ---
export const BASE_SPEED = 150; // px/s bei level 0
export const MAX_SPEED = 620; // Deckel
export const SPEED_GAIN_PER_LEVEL = 28; // px/s pro Treffer schneller

// --- Verstecken hinter Objekten ---
export const BASE_HIDE_CHANCE = 0; // level 0: versteckt sich nie
export const HIDE_CHANCE_PER_LEVEL = 0.05; // steigt pro Treffer
export const MAX_HIDE_CHANCE = 0.6; // maximale Versteck-Wahrscheinlichkeit

// --- Animationen ---
export const FALL_DURATION = 1.1; // Sekunden, die ein Kackhaufen fällt
export const FALL_GRAVITY = 1400; // px/s^2
export const STAR_DURATION = 0.7; // Lebensdauer eines Sternchens
export const STARS_PER_HIT = 8;

// --- Runde & Zeit ---
export const ROUND_TIME = 60; // Sekunden pro Runde

// --- Combo-Multiplikator ---
export const COMBO_STEP = 5; // alle 5 Treffer in Folge +1 Multiplikator
export const MAX_MULTIPLIER = 5; // Deckel für den Multiplikator

// --- Kapitäns-Kackhaufen (seltener, extra stinkiger Bonus-Haufen) ---
export const CAPTAIN_CHANCE = 0.12; // Wahrscheinlichkeit pro Spawn (ab Level 1)
export const CAPTAIN_BONUS = 5; // Basispunkte statt 1 (wird mit Multiplikator multipliziert)
