import "./styles.css";
import { WORLD_WIDTH, WORLD_HEIGHT } from "./game/config";
import { createGame, update, handleTap } from "./game/engine";
import { draw } from "./render/renderer";
import { computeView, attachTap, type ViewTransform } from "./input/pointer";
import { unlockAudio, playHit, playMiss } from "./audio/sfx";

const world = { width: WORLD_WIDTH, height: WORLD_HEIGHT };
const state = createGame(world);

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
let view: ViewTransform = computeView(world, 1, 1);

function resize(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  view = computeView(world, canvas.width, canvas.height);
}

window.addEventListener("resize", resize);
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Letterbox-Balken
  ctx.fillStyle = "#0b3d2e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(view.scale, 0, 0, view.scale, view.offsetX, view.offsetY);
  draw(ctx, state);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
