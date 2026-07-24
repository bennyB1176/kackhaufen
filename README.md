# 💩 Kackhaufen fangen!

Ein kindgerechtes 2D-Handyspiel im **Querformat**: Ein Kackhaufen mit Augen und
kleinen schwarzen Beinchen läuft über die Wiese. Tippe ihn an, bevor er entwischt!

## So wird gespielt

- Der **Kackhaufen läuft von links nach rechts** (und wieder zurück).
- **Tippst du ihn an** → ein Punkt ⭐ und er fällt lustig um (mit Sound & Sternchen).
- **Tippst du daneben** → ein Punkt weg. Hast du keine Punkte, passiert nichts.
- **Jeder Treffer macht es schwerer**: Er wird **kleiner**, **schneller** und
  **versteckt sich häufiger hinter Büschen, Kisten & Steinen**.

Am besten auf dem Handy im **Querformat** spielen. 📱🔄

## Architektur

Reines **Web-Spiel** (läuft im Browser, keine App-Installation nötig):

- **TypeScript** + **HTML5 Canvas** für die Darstellung
- **Vite** als Dev-Server / Build-Tool
- **Vitest** für die Unit-Tests (Entwicklung nach **TDD**)
- **Web Audio API** für synthetisierte Soundeffekte (keine externen Dateien)

Die **reine Spiellogik** (`src/game/`) ist strikt vom **Rendering, Input und Audio**
getrennt und vollständig unit-getestet:

```
src/
  game/    Spiellogik (pur, getestet): types, config, difficulty, poop, collision, scoring, engine
  render/  Canvas-Zeichnen (Kackhaufen, Beinchen, Objekte, Punkte, Animationen)
  input/   Tap → Spielkoordinaten
  audio/   Soundeffekte per Web Audio
  main.ts  bindet alles zusammen (Render-Loop)
tests/     Vitest-Tests zur Spiellogik
```

## Entwicklung

```bash
npm install      # Abhängigkeiten installieren
npm run dev      # lokal starten (URL im Terminal öffnen)
npm test         # Tests ausführen
npm run build    # Produktions-Build nach dist/
```

Zum Testen am „Handy": im Browser die DevTools öffnen, die Geräte-Ansicht
aktivieren und ins **Querformat** drehen.

## Qualität & Sicherheit (CI)

Bei jedem Push laufen automatisch (siehe `.github/workflows/`):

- **CI** (`ci.yml`): Typecheck, Tests und Build.
- **gitleaks** (`ci.yml` + `.gitleaks.toml`): Scan auf versehentlich committete Secrets.
- **Deployment** (`deploy.yml`): baut das Spiel und veröffentlicht es auf **GitHub Pages**.

> Einmalige Einrichtung: In den Repo-Einstellungen unter **Settings → Pages** die
> Quelle auf **„GitHub Actions"** stellen. Danach ist das Spiel unter
> `https://<user>.github.io/kackhaufen/` spielbar.
