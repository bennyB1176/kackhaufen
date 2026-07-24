import "./styles.css";
import { WORLD_HEIGHT } from "./game/config";
import { createGame, update, handleTap, restartGame } from "./game/engine";
import { draw } from "./render/renderer";
import { computeView, attachTap, type ViewTransform } from "./input/pointer";
import { unlockAudio, playHit, playMiss, playCheer } from "./audio/sfx";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const startScreen = document.getElementById("start-screen") as HTMLDivElement;
const startButton = document.getElementById("start-button") as HTMLButtonElement;
const gameoverScreen = document.getElementById("gameover-screen") as HTMLDivElement;
const restartButton = document.getElementById("restart-button") as HTMLButtonElement;
const finalScoreEl = document.getElementById("final-score") as HTMLSpanElement;
const highscoreEl = document.getElementById("highscore") as HTMLSpanElement;
const newRecordEl = document.getElementById("new-record") as HTMLDivElement;

const HIGHSCORE_KEY = "kackhaufen.highscore";

function loadHighscore(): number {
  const raw = localStorage.getItem(HIGHSCORE_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

function saveHighscore(value: number): void {
  try {
    localStorage.setItem(HIGHSCORE_KEY, String(value));
  } catch {
    /* localStorage kann im Privatmodus fehlschlagen – dann eben kein Highscore. */
  }
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

/** Zeigt den Game-Over-Bildschirm mit Punktzahl und (evtl. neuem) Highscore. */
function showGameOver(): void {
  const best = loadHighscore();
  const isRecord = state.score > best;
  if (isRecord) saveHighscore(state.score);

  finalScoreEl.textContent = String(state.score);
  highscoreEl.textContent = String(Math.max(best, state.score));
  newRecordEl.classList.toggle("hidden", !isRecord);
  gameoverScreen.classList.remove("hidden");
  playCheer();
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
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restart);
