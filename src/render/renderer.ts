import type { GameState, Poop } from "../game/types";
import { GROUND_HEIGHT } from "../game/config";

/**
 * Zeichnet die komplette Szene in Spielkoordinaten (Welt-Maße).
 * Die Skalierung auf die echte Canvas-Größe übernimmt main.ts.
 */
export function draw(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { world } = state;
  drawBackground(ctx, world.width, world.height);

  // Kackhaufen (hinter den Objekten)
  drawPoop(ctx, state.poop);

  // umfallende Kackhaufen
  for (const f of state.falling) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rotation);
    drawEmoji(ctx, "💩", 0, 0, f.size);
    ctx.restore();
  }

  // Objekte davor (verdecken den Kackhaufen)
  for (const o of state.obstacles) {
    drawEmoji(ctx, o.emoji, o.x + o.width / 2, o.y + o.height / 2, o.height);
  }

  // Sternchen-Feuerwerk
  for (const s of state.stars) {
    const alpha = Math.max(0, Math.min(1, s.life / 0.7));
    ctx.globalAlpha = alpha;
    drawEmoji(ctx, "⭐", s.x, s.y, 54);
    ctx.globalAlpha = 1;
  }

  drawScore(ctx, state.score, world.width);
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  // Himmel
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#8fd3ff");
  sky.addColorStop(1, "#d6f2ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Sonne
  ctx.fillStyle = "#ffe14d";
  ctx.beginPath();
  ctx.arc(w - 140, 130, 70, 0, Math.PI * 2);
  ctx.fill();

  // Wolken
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  cloud(ctx, 220, 140, 60);
  cloud(ctx, 540, 100, 46);

  // Wiese
  const grassTop = h - GROUND_HEIGHT;
  const grass = ctx.createLinearGradient(0, grassTop, 0, h);
  grass.addColorStop(0, "#7ed957");
  grass.addColorStop(1, "#57b33a");
  ctx.fillStyle = grass;
  ctx.fillRect(0, grassTop, w, GROUND_HEIGHT);
  // kleine Grasbüschel-Linie
  ctx.strokeStyle = "#4c9c32";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, grassTop + 4);
  ctx.lineTo(w, grassTop + 4);
  ctx.stroke();
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x + r, y + 10, r * 0.8, 0, Math.PI * 2);
  ctx.arc(x - r, y + 12, r * 0.7, 0, Math.PI * 2);
  ctx.fill();
}

function drawPoop(ctx: CanvasRenderingContext2D, poop: Poop): void {
  drawLegs(ctx, poop);
  drawEmoji(ctx, "💩", poop.x, poop.y, poop.size);
}

/** Zwei kleine schwarze Beinchen mit einfachem Lauf-Zyklus. */
function drawLegs(ctx: CanvasRenderingContext2D, poop: Poop): void {
  const legLen = poop.size * 0.22;
  const legW = Math.max(5, poop.size * 0.05);
  const hipY = poop.y + poop.size * 0.34;
  const spread = poop.size * 0.16;
  const swing = Math.sin(poop.walk * Math.PI * 2) * legLen * 0.6;

  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = legW;
  ctx.lineCap = "round";

  // linkes Bein
  ctx.beginPath();
  ctx.moveTo(poop.x - spread, hipY);
  ctx.lineTo(poop.x - spread + swing, hipY + legLen);
  ctx.stroke();
  // rechtes Bein (gegenphasig)
  ctx.beginPath();
  ctx.moveTo(poop.x + spread, hipY);
  ctx.lineTo(poop.x + spread - swing, hipY + legLen);
  ctx.stroke();
}

function drawEmoji(
  ctx: CanvasRenderingContext2D,
  glyph: string,
  cx: number,
  cy: number,
  size: number,
): void {
  ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(glyph, cx, cy);
}

function drawScore(ctx: CanvasRenderingContext2D, score: number, w: number): void {
  const text = `⭐ ${score}`;
  ctx.font = 'bold 64px "Baloo 2","Comic Sans MS",system-ui,sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#ffffff";
  ctx.strokeText(text, w / 2, 24);
  ctx.fillStyle = "#7a4a1e";
  ctx.fillText(text, w / 2, 24);
}
