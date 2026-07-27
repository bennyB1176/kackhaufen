/**
 * Lokale Highscore-Liste mit Namen.
 *
 * Die reine Logik (sortieren, einfügen, Namen säubern, JSON parsen) ist
 * bewusst vom Speicherzugriff getrennt: die Tests laufen ohne DOM/localStorage,
 * können aber trotzdem alles Wesentliche prüfen.
 */

export interface HighscoreEntry {
  name: string;
  score: number;
}

/** So viele Plätze hat die Bestenliste. */
export const MAX_HIGHSCORES = 5;
/** Maximale Namenslänge (passt auch auf schmale Handys). */
export const MAX_NAME_LENGTH = 12;

const STORAGE_KEY = "kackhaufen.highscores";
/** Alter Schlüssel aus der Zeit vor der Bestenliste (eine einzelne Zahl). */
const LEGACY_KEY = "kackhaufen.highscore";
const LAST_NAME_KEY = "kackhaufen.lastname";

/**
 * Macht aus einer Roh-Eingabe einen brauchbaren Namen: Leerzeichen am Rand weg,
 * Mehrfach-Leerzeichen zusammenfassen, auf MAX_NAME_LENGTH kürzen. Wer nichts
 * einträgt, heißt „Anonym".
 */
export function sanitizeName(raw: string): string {
  const cleaned = raw.replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
  return cleaned.length > 0 ? cleaned : "Anonym";
}

/**
 * Reicht dieser Punktestand für die Bestenliste?
 * 0 Punkte kommen nie hinein; sonst zählt ein freier Platz oder ein Score,
 * der besser als der letzte Eintrag ist.
 */
export function qualifies(list: HighscoreEntry[], score: number): boolean {
  if (score <= 0) return false;
  if (list.length < MAX_HIGHSCORES) return true;
  return score > list[list.length - 1].score;
}

/**
 * Fügt einen Eintrag ein und liefert die neue, absteigend sortierte Liste
 * (auf MAX_HIGHSCORES gekürzt). Bei Gleichstand landet der neue Eintrag
 * hinter den bereits vorhandenen – wer den Score zuerst hatte, bleibt vorn.
 */
export function insertEntry(
  list: HighscoreEntry[],
  entry: HighscoreEntry,
): HighscoreEntry[] {
  const index = list.findIndex((e) => entry.score > e.score);
  const next = [...list];
  next.splice(index === -1 ? next.length : index, 0, entry);
  return next.slice(0, MAX_HIGHSCORES);
}

/**
 * Liest eine gespeicherte Liste robust ein: kaputtes JSON, fremde Strukturen
 * oder einzelne ungültige Einträge dürfen das Spiel nicht lahmlegen.
 */
export function parseHighscores(raw: string | null): HighscoreEntry[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  const entries: HighscoreEntry[] = [];
  for (const item of data) {
    if (typeof item !== "object" || item === null) continue;
    const { name, score } = item as { name?: unknown; score?: unknown };
    if (typeof name !== "string") continue;
    if (typeof score !== "number" || !Number.isFinite(score)) continue;
    entries.push({ name: sanitizeName(name), score: Math.floor(score) });
  }
  return entries
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_HIGHSCORES);
}

// --------------------------------------------------------------------------
// Speicherzugriff (dünne Wrapper – im Privatmodus darf das fehlschlagen)
// --------------------------------------------------------------------------

function storage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

/**
 * Lädt die Bestenliste. Gibt es noch keine, wird ein alter Einzel-Highscore
 * aus der Vorversion als erster Eintrag übernommen, damit der bereits
 * erspielte Rekord nicht verloren geht.
 */
export function loadHighscores(): HighscoreEntry[] {
  const store = storage();
  if (!store) return [];

  const list = parseHighscores(store.getItem(STORAGE_KEY));
  if (list.length > 0) return list;

  const legacy = Number.parseInt(store.getItem(LEGACY_KEY) ?? "", 10);
  if (Number.isFinite(legacy) && legacy > 0) {
    return [{ name: "Rekord", score: legacy }];
  }
  return [];
}

export function saveHighscores(list: HighscoreEntry[]): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* Speicher voll oder gesperrt – dann eben ohne Persistenz weiterspielen. */
  }
}

/** Zuletzt benutzter Name, um das Eingabefeld vorzubelegen. */
export function loadLastName(): string {
  return storage()?.getItem(LAST_NAME_KEY) ?? "";
}

export function saveLastName(name: string): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(LAST_NAME_KEY, name);
  } catch {
    /* siehe oben */
  }
}
