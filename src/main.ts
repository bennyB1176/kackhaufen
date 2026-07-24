import "./styles.css";
import { WORLD_HEIGHT } from "./game/config";
import { createGame, update, handleTap } from "./game/engine";
import { draw } from "./render/renderer";
import { computeView, attachTap, type ViewTransform } from "./input/pointer";
import { unlockAudio, playHit, playMiss } from "./audio/sfx";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const startScreen = document.getElementById("start-screen") as HTMLDivElement;
const startButton = document.getElementById("start-button") as HTMLButtonElement;

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
    unlockAudio();
    const result = handleTap(state, x, y);
    if (result === "hit") playHit();
    else playMiss();
  },
);

let last = performance.now();
function loop(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  update(state, dt);

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
  if (!running) {
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }
}

startButton.addEventListener("click", startGame);
