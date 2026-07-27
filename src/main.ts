import "./styles.css";
import { WORLD_HEIGHT } from "./game/config";
import { createGame, update, handleTap, restartGame } from "./game/engine";
import { draw } from "./render/renderer";
import { computeView, attachTap, type ViewTransform } from "./input/pointer";
import { unlockAudio, playHit, playMiss, playCheer } from "./audio/sfx";
import {
  loadHighscores,
  saveHighscores,
  loadLastName,
  saveLastName,
  qualifies,
  insertEntry,
  sanitizeName,
  type HighscoreEntry,
} from "./game/highscore";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const startScreen = document.getElementById("start-screen") as HTMLDivElement;
const startButton = document.getElementById("start-button") as HTMLButtonElement;
const gameoverScreen = document.getElementById("gameover-screen") as HTMLDivElement;
const restartButton = document.getElementById("restart-button") as HTMLButtonElement;
const finalScoreEl = document.getElementById("final-score") as HTMLSpanElement;
const newRecordEl = document.getElementById("new-record") as HTMLDivElement;
const nameEntry = document.getElementById("name-entry") as HTMLDivElement;
const nameInput = document.getElementById("name-input") as HTMLInputElement;
const saveNameButton = document.getElementById("save-name-button") as HTMLButtonElement;
const highscoreList = document.getElementById("highscore-list") as HTMLOListElement;

/**
 * Zeichnet die Bestenliste. `highlight` markiert den gerade eingetragenen
 * Namen (Index in der Liste), damit man sich sofort wiederfindet.
 */
function renderHighscores(list: HighscoreEntry[], highlight = -1): void {
  highscoreList.replaceChildren();

  if (list.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Noch keine Einträge – sei der Erste!";
    highscoreList.append(li);
    return;
  }

  list.forEach((entry, i) => {
    const li = document.createElement("li");
    if (i === highlight) li.classList.add("is-new");

    const rank = document.createElement("span");
    rank.className = "rank";
    rank.textContent = `${i + 1}.`;

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = entry.name;

    const points = document.createElement("span");
    points.className = "points";
    points.textContent = String(entry.score);

    li.append(rank, name, points);
    highscoreList.append(li);
  });
}

/** Welt-Höhe ist fix; die Breite passt sich dem Bildschirm-Seitenverhältnis an
 *  (so gibt es keine Balken). */
function aspect(): number {
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  return w / h;
}

const state = createGame({ width: Math.round(WORLD_HEIGHT * aspect()), height: WORLD_HEIGHT });
let view: ViewTransform = computeView(state.world, 1, 1);
let running = false;

function resize(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  // Welt-Breite an das aktuelle Seitenverhältnis anpassen (füllt den Schirm).
  state.world.width = Math.round(WORLD_HEIGHT * aspect());
  view = computeView(state.world, canvas.width, canvas.height);
}

window.addEventListener("resize", resize);
window.visualViewport?.addEventListener("resize", resize);
resize();

attachTap(
  canvas,
  () => view,
  (x, y) => {
    if (state.phase !== "playing") return; // im Game-Over-Zustand keine Taps
    unlockAudio();
    const result = handleTap(state, x, y);
    if (result === "hit") playHit();
    else playMiss();
  },
);

/**
 * Zeigt den Game-Over-Bildschirm: Punktzahl, Bestenliste und – wenn der
 * Punktestand für die Liste reicht – das Feld für den Namen.
 */
function showGameOver(): void {
  const list = loadHighscores();
  const madeIt = qualifies(list, state.score);

  finalScoreEl.textContent = String(state.score);
  renderHighscores(list);
  newRecordEl.classList.add("hidden");

  nameEntry.classList.toggle("hidden", !madeIt);
  if (madeIt) {
    nameInput.value = loadLastName();
    // Erst nach dem Einblenden fokussieren, sonst öffnet die Handy-Tastatur nicht.
    requestAnimationFrame(() => {
      nameInput.focus();
      nameInput.select();
    });
  }

  gameoverScreen.classList.remove("hidden");
  playCheer();
}

/** Trägt den eingegebenen Namen mit dem Punktestand in die Bestenliste ein. */
function submitName(): void {
  const name = sanitizeName(nameInput.value);
  const entry: HighscoreEntry = { name, score: state.score };
  const list = insertEntry(loadHighscores(), entry);
  const position = list.indexOf(entry);

  saveHighscores(list);
  saveLastName(name);

  renderHighscores(list, position);
  newRecordEl.classList.toggle("hidden", position !== 0);
  nameEntry.classList.add("hidden");
  nameInput.blur();
}

let gameoverShown = false;

let last = performance.now();
function loop(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  update(state, dt);

  if (state.phase === "gameover" && !gameoverShown) {
    gameoverShown = true;
    showGameOver();
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // Voll-bildschirm Himmelfarbe als Sicherheitsnetz (statt Balken).
  ctx.fillStyle = "#8fd3ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(view.scale, 0, 0, view.scale, view.offsetX, view.offsetY);
  draw(ctx, state);

  requestAnimationFrame(loop);
}

/** Vom Start-Button ausgelöst: Ton frei, Vollbild, Querformat, Spiel starten. */
async function startGame(): Promise<void> {
  unlockAudio();
  try {
    await document.documentElement.requestFullscreen?.();
  } catch {
    /* iOS Safari kann kein Element-Vollbild – dann bleibt es bildschirmfüllend. */
  }
  try {
    // Nach dem Vollbild wenn möglich ins Querformat drehen.
    await (screen.orientation as { lock?: (o: string) => Promise<void> })?.lock?.("landscape");
  } catch {
    /* Orientierungs-Lock ist nicht überall erlaubt – egal. */
  }
  resize();
  startScreen.classList.add("hidden");
  gameoverShown = false;
  if (!running) {
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }
}

/** „Nochmal!": neue Runde im selben State starten, Overlay ausblenden. */
function restart(): void {
  unlockAudio();
  restartGame(state);
  gameoverShown = false;
  gameoverScreen.classList.add("hidden");
  nameEntry.classList.add("hidden");
  newRecordEl.classList.add("hidden");
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restart);
saveNameButton.addEventListener("click", submitName);
// Auf dem Handy schickt die Enter-Taste der Tastatur den Namen ab.
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    submitName();
  }
});
