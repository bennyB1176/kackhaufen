import { describe, it, expect } from "vitest";
import {
  sanitizeName,
  qualifies,
  insertEntry,
  parseHighscores,
  MAX_HIGHSCORES,
  MAX_NAME_LENGTH,
  type HighscoreEntry,
} from "../src/game/highscore";

/** Hilfsliste mit absteigenden Punkten. */
function listOf(...scores: number[]): HighscoreEntry[] {
  return scores.map((score, i) => ({ name: `Spieler${i}`, score }));
}

describe("highscore", () => {
  describe("sanitizeName", () => {
    it("entfernt Leerzeichen am Rand", () => {
      expect(sanitizeName("  Ben  ")).toBe("Ben");
    });

    it("fasst Mehrfach-Leerzeichen zusammen", () => {
      expect(sanitizeName("Ben    Junior")).toBe("Ben Junior");
    });

    it("kürzt zu lange Namen", () => {
      const long = "Donaudampfschifffahrt";
      expect(sanitizeName(long)).toHaveLength(MAX_NAME_LENGTH);
    });

    it("nimmt 'Anonym', wenn nichts eingetragen wurde", () => {
      expect(sanitizeName("")).toBe("Anonym");
      expect(sanitizeName("   ")).toBe("Anonym");
    });
  });

  describe("qualifies", () => {
    it("0 Punkte kommen nie in die Liste", () => {
      expect(qualifies([], 0)).toBe(false);
      expect(qualifies([], -3)).toBe(false);
    });

    it("bei freien Plätzen reicht jeder Punktestand über 0", () => {
      expect(qualifies([], 1)).toBe(true);
      expect(qualifies(listOf(100, 90), 5)).toBe(true);
    });

    it("bei voller Liste muss der letzte Eintrag übertroffen werden", () => {
      const full = listOf(50, 40, 30, 20, 10);
      expect(full).toHaveLength(MAX_HIGHSCORES);
      expect(qualifies(full, 11)).toBe(true);
      expect(qualifies(full, 10)).toBe(false); // gleich hoch reicht nicht
      expect(qualifies(full, 9)).toBe(false);
    });
  });

  describe("insertEntry", () => {
    it("sortiert absteigend nach Punkten", () => {
      const list = insertEntry(listOf(50, 20), { name: "Neu", score: 30 });
      expect(list.map((e) => e.score)).toEqual([50, 30, 20]);
      expect(list[1].name).toBe("Neu");
    });

    it("setzt einen Spitzenwert an Platz 1", () => {
      const list = insertEntry(listOf(50, 20), { name: "Neu", score: 99 });
      expect(list[0]).toEqual({ name: "Neu", score: 99 });
    });

    it("hängt an, wenn der Wert am kleinsten ist", () => {
      const list = insertEntry(listOf(50, 20), { name: "Neu", score: 5 });
      expect(list[list.length - 1].name).toBe("Neu");
    });

    it("stellt bei Gleichstand den bestehenden Eintrag nach vorn", () => {
      const list = insertEntry(listOf(50, 30), { name: "Neu", score: 30 });
      expect(list.map((e) => e.name)).toEqual(["Spieler0", "Spieler1", "Neu"]);
    });

    it("kürzt die Liste auf MAX_HIGHSCORES", () => {
      const full = listOf(50, 40, 30, 20, 10);
      const list = insertEntry(full, { name: "Neu", score: 45 });
      expect(list).toHaveLength(MAX_HIGHSCORES);
      expect(list.map((e) => e.score)).toEqual([50, 45, 40, 30, 20]);
    });

    it("verändert die übergebene Liste nicht", () => {
      const original = listOf(50, 20);
      insertEntry(original, { name: "Neu", score: 30 });
      expect(original).toHaveLength(2);
    });
  });

  describe("parseHighscores", () => {
    it("liefert eine leere Liste ohne gespeicherte Daten", () => {
      expect(parseHighscores(null)).toEqual([]);
      expect(parseHighscores("")).toEqual([]);
    });

    it("verkraftet kaputtes JSON", () => {
      expect(parseHighscores("{nicht: json")).toEqual([]);
    });

    it("verkraftet fremde Strukturen", () => {
      expect(parseHighscores('{"foo":1}')).toEqual([]);
    });

    it("überspringt ungültige Einträge und behält gültige", () => {
      const raw = JSON.stringify([
        { name: "Ben", score: 30 },
        { name: "OhnePunkte" },
        { score: 10 },
        null,
        "text",
        { name: "Mia", score: "viel" },
        { name: "Tim", score: 20 },
      ]);
      expect(parseHighscores(raw)).toEqual([
        { name: "Ben", score: 30 },
        { name: "Tim", score: 20 },
      ]);
    });

    it("sortiert gespeicherte Einträge absteigend", () => {
      const raw = JSON.stringify([
        { name: "Klein", score: 5 },
        { name: "Groß", score: 50 },
      ]);
      expect(parseHighscores(raw).map((e) => e.name)).toEqual(["Groß", "Klein"]);
    });
  });
});
