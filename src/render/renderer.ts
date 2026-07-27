import type { GameState, Poop, Obstacle } from "../game/types";
import { GROUND_HEIGHT } from "../game/config";
import { comboMultiplier } from "../game/scoring";

const HUD_FONT = 'bold 44px "Baloo 2","Comic Sans MS",system-ui,sans-serif';

/**
 * Zeichnet die komplette Szene in Spielkoordinaten (Welt-Maße).
 * Alles wird als Vektor-Form gezeichnet (keine Emoji-Glyphen), damit es
 * auf jedem Gerät gleich und farbig aussieht.
 */
export function draw(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { world } = state;
  drawBackground(ctx, world.width, world.height);

  // Kackhaufen (hinter den Objekten)
  drawPoopBody(ctx, state.poop.x, state.poop.y, state.poop.size);
  drawLegs(ctx, state.poop);
  // Kapitäns-Kackhaufen: extra Stinkwölkchen + Mütze (werden von Objekten verdeckt)
  if (state.poop.captain) {
    drawStinkLines(ctx, state.poop.x, state.poop.y, state.poop.size, state.poop.walk);
    drawCaptainHat(ctx, state.poop.x, state.poop.y, state.poop.size);
  }

  // umfallende Kackhaufen
  for (const f of state.falling) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rotation);
    drawPoopBody(ctx, 0, 0, f.size);
    ctx.restore();
  }

  // Objekte davor (verdecken den Kackhaufen). Das Objekt, hinter dem er
  // gerade steckt, wackelt leicht – so ist vorher zu ahnen, wo er gleich
  // hervorlugt, und das Versteckspiel bleibt fair.
  state.obstacles.forEach((o, i) => {
    const { poop } = state;
    const wobbling =
      poop.mode === "peek" && poop.peekPhase === "hiding" && poop.anchor === i;
    if (!wobbling) {
      drawObstacle(ctx, o);
      return;
    }
    // `timer` läuft während des Versteckens herunter und treibt das Wackeln an.
    const sway = Math.sin(poop.timer * 26) * 5;
    ctx.save();
    ctx.translate(sway, 0);
    drawObstacle(ctx, o);
    ctx.restore();
  });

  // Sternchen-Feuerwerk
  for (const s of state.stars) {
    const alpha = Math.max(0, Math.min(1, s.life / 0.7));
    ctx.globalAlpha = alpha;
    drawStar(ctx, s.x, s.y, 26, "#ffd23f");
    ctx.globalAlpha = 1;
  }

  // HUD: Punkte (Mitte), Timer (links), Multiplikator (rechts)
  drawScore(ctx, state.score, world.width);
  drawTimer(ctx, state.timeLeft);
  drawMultiplier(ctx, state.combo, world.width);
}

// --------------------------------------------------------------------------
// Hintergrund
// --------------------------------------------------------------------------

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

// --------------------------------------------------------------------------
// Kackhaufen (braun, mit Gesicht)
// --------------------------------------------------------------------------

function ellipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Klassischer Kackhaufen: brauner Swirl aus drei gestapelten Blobs,
 * dazu zwei Kulleraugen und ein lächelnder Mund – zentriert auf (cx, cy).
 */
function drawPoopBody(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
): void {
  const dark = "#5a3210";
  const mid = "#7a4a1e";
  const light = "#986a34";

  // Körper von unten nach oben (breit -> schmal)
  ellipse(ctx, cx, cy + size * 0.3, size * 0.44, size * 0.2, dark);
  ellipse(ctx, cx, cy + size * 0.28, size * 0.42, size * 0.19, mid);
  ellipse(ctx, cx, cy + size * 0.04, size * 0.33, size * 0.18, mid);
  ellipse(ctx, cx, cy - size * 0.18, size * 0.21, size * 0.15, mid);
  // Glanzkanten oben auf jeder Stufe
  ellipse(ctx, cx - size * 0.02, cy - size * 0.01, size * 0.3, size * 0.09, light);
  ellipse(ctx, cx - size * 0.02, cy - size * 0.22, size * 0.18, size * 0.07, light);
  // kleine Spitze oben
  ctx.fillStyle = mid;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.08, cy - size * 0.28);
  ctx.quadraticCurveTo(cx, cy - size * 0.44, cx + size * 0.08, cy - size * 0.28);
  ctx.fill();

  // --- Gesicht ---
  const eyeY = cy - size * 0.04;
  const eyeDx = size * 0.13;
  const eyeR = size * 0.12;
  // Augäpfel
  ellipse(ctx, cx - eyeDx, eyeY, eyeR, eyeR * 1.15, "#ffffff");
  ellipse(ctx, cx + eyeDx, eyeY, eyeR, eyeR * 1.15, "#ffffff");
  // Pupillen
  ellipse(ctx, cx - eyeDx + size * 0.01, eyeY + size * 0.01, eyeR * 0.5, eyeR * 0.5, "#221100");
  ellipse(ctx, cx + eyeDx + size * 0.01, eyeY + size * 0.01, eyeR * 0.5, eyeR * 0.5, "#221100");
  // Glanzpunkte in den Augen
  ellipse(ctx, cx - eyeDx - size * 0.03, eyeY - size * 0.03, eyeR * 0.18, eyeR * 0.18, "#ffffff");
  ellipse(ctx, cx + eyeDx - size * 0.03, eyeY - size * 0.03, eyeR * 0.18, eyeR * 0.18, "#ffffff");

  // lächelnder Mund
  ctx.strokeStyle = "#221100";
  ctx.lineWidth = Math.max(3, size * 0.035);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy + size * 0.06, size * 0.17, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

/** Zwei kleine schwarze Beinchen mit einfachem Lauf-Zyklus. */
function drawLegs(ctx: CanvasRenderingContext2D, poop: Poop): void {
  const legLen = poop.size * 0.22;
  const legW = Math.max(5, poop.size * 0.05);
  const hipY = poop.y + poop.size * 0.42;
  const spread = poop.size * 0.16;
  const swing = Math.sin(poop.walk * Math.PI * 2) * legLen * 0.6;

  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = legW;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(poop.x - spread, hipY);
  ctx.lineTo(poop.x - spread + swing, hipY + legLen);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(poop.x + spread, hipY);
  ctx.lineTo(poop.x + spread - swing, hipY + legLen);
  ctx.stroke();
}

// --------------------------------------------------------------------------
// Hindernisse (Busch / Stein / Haus)
// --------------------------------------------------------------------------

function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle): void {
  switch (o.kind) {
    case "bush":
      drawBush(ctx, o);
      break;
    case "stone":
      drawStone(ctx, o);
      break;
    case "house":
      drawHouse(ctx, o);
      break;
  }
}

function drawBush(ctx: CanvasRenderingContext2D, o: Obstacle): void {
  const cx = o.x + o.width / 2;
  const base = o.y + o.height;
  const r = o.width * 0.34;
  // Stamm
  ctx.fillStyle = "#7a5230";
  ctx.fillRect(cx - o.width * 0.06, base - r * 1.1, o.width * 0.12, r * 1.1);
  // Laub (mehrere Kreise)
  const foliageBottom = base - r * 0.9;
  ellipse(ctx, cx, foliageBottom - r * 1.3, r * 1.15, r * 1.15, "#2f8f3e");
  ellipse(ctx, cx - r, foliageBottom - r * 0.4, r, r, "#37a248");
  ellipse(ctx, cx + r, foliageBottom - r * 0.4, r, r, "#37a248");
  ellipse(ctx, cx, foliageBottom, r * 1.1, r * 0.9, "#3fb151");
  // Highlights
  ellipse(ctx, cx - r * 0.5, foliageBottom - r * 1.7, r * 0.35, r * 0.35, "#61c96f");
  ellipse(ctx, cx + r * 0.6, foliageBottom - r * 1.1, r * 0.28, r * 0.28, "#61c96f");
}

function drawStone(ctx: CanvasRenderingContext2D, o: Obstacle): void {
  const cx = o.x + o.width / 2;
  const base = o.y + o.height;
  const top = o.y + o.height * 0.28;
  const halfW = o.width * 0.46;
  // Felsform (abgerundetes Polygon)
  ctx.fillStyle = "#8d949c";
  ctx.beginPath();
  ctx.moveTo(cx - halfW, base);
  ctx.quadraticCurveTo(cx - halfW * 1.05, top + (base - top) * 0.35, cx - halfW * 0.4, top);
  ctx.quadraticCurveTo(cx, top - (base - top) * 0.25, cx + halfW * 0.5, top);
  ctx.quadraticCurveTo(cx + halfW * 1.05, top + (base - top) * 0.4, cx + halfW, base);
  ctx.closePath();
  ctx.fill();
  // Schatten unten
  ctx.fillStyle = "#767d85";
  ctx.beginPath();
  ctx.moveTo(cx - halfW, base);
  ctx.quadraticCurveTo(cx, base - (base - top) * 0.25, cx + halfW, base);
  ctx.lineTo(cx + halfW, base);
  ctx.closePath();
  ctx.fill();
  // Glanz oben links
  ellipse(ctx, cx - halfW * 0.3, top + (base - top) * 0.3, halfW * 0.35, (base - top) * 0.18, "#aab0b7");
}

function drawHouse(ctx: CanvasRenderingContext2D, o: Obstacle): void {
  const wallTop = o.y + o.height * 0.42;
  const wallH = o.height - (wallTop - o.y);
  const wallX = o.x + o.width * 0.1;
  const wallW = o.width * 0.8;
  // Wand
  ctx.fillStyle = "#f4d59b";
  ctx.fillRect(wallX, wallTop, wallW, wallH);
  // Dach (Dreieck, überlappt Wand)
  ctx.fillStyle = "#d1523f";
  ctx.beginPath();
  ctx.moveTo(o.x, wallTop + 6);
  ctx.lineTo(o.x + o.width / 2, o.y);
  ctx.lineTo(o.x + o.width, wallTop + 6);
  ctx.closePath();
  ctx.fill();
  // Tür
  ctx.fillStyle = "#8a5a2b";
  const doorW = wallW * 0.3;
  const doorH = wallH * 0.55;
  ctx.fillRect(wallX + wallW / 2 - doorW / 2, wallTop + wallH - doorH, doorW, doorH);
  // Türknauf
  ellipse(ctx, wallX + wallW / 2 + doorW * 0.28, wallTop + wallH - doorH * 0.5, wallW * 0.03, wallW * 0.03, "#ffe14d");
  // Fenster
  ctx.fillStyle = "#8fd3ff";
  const winS = wallW * 0.22;
  ctx.fillRect(wallX + wallW * 0.12, wallTop + wallH * 0.18, winS, winS);
  ctx.strokeStyle = "#f4d59b";
  ctx.lineWidth = Math.max(2, winS * 0.12);
  ctx.beginPath();
  ctx.moveTo(wallX + wallW * 0.12 + winS / 2, wallTop + wallH * 0.18);
  ctx.lineTo(wallX + wallW * 0.12 + winS / 2, wallTop + wallH * 0.18 + winS);
  ctx.moveTo(wallX + wallW * 0.12, wallTop + wallH * 0.18 + winS / 2);
  ctx.lineTo(wallX + wallW * 0.12 + winS, wallTop + wallH * 0.18 + winS / 2);
  ctx.stroke();
}

// --------------------------------------------------------------------------
// Stern & Punkte
// --------------------------------------------------------------------------

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.strokeStyle = "#e0a800";
  ctx.lineWidth = Math.max(1.5, r * 0.08);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outer = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const inner = outer + Math.PI / 5;
    const ox = cx + Math.cos(outer) * r;
    const oy = cy + Math.sin(outer) * r;
    const ix = cx + Math.cos(inner) * r * 0.45;
    const iy = cy + Math.sin(inner) * r * 0.45;
    if (i === 0) ctx.moveTo(ox, oy);
    else ctx.lineTo(ox, oy);
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawScore(ctx: CanvasRenderingContext2D, score: number, w: number): void {
  const text = String(score);
  ctx.font = 'bold 64px "Baloo 2","Comic Sans MS",system-ui,sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const starX = w / 2 - 60;
  const y = 52;
  drawStar(ctx, starX, y, 30, "#ffd23f");
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#ffffff";
  ctx.strokeText(text, starX + 44, y);
  ctx.fillStyle = "#7a4a1e";
  ctx.fillText(text, starX + 44, y);
}

// --------------------------------------------------------------------------
// HUD: Timer & Multiplikator
// --------------------------------------------------------------------------

/** Uhr-Icon mit verbleibenden Sekunden oben links (letzte 10 s rot). */
function drawTimer(ctx: CanvasRenderingContext2D, timeLeft: number): void {
  const secs = Math.ceil(timeLeft);
  const low = secs <= 10;
  const cx = 46;
  const cy = 52;
  const r = 26;

  // Ziffernblatt
  ctx.fillStyle = low ? "#ff6b6b" : "#ffffff";
  ctx.strokeStyle = "#7a4a1e";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Zeiger
  ctx.lineCap = "round";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy - r * 0.6);
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + r * 0.5, cy + r * 0.1);
  ctx.stroke();

  // Sekunden-Zahl daneben
  const text = String(secs);
  ctx.font = HUD_FONT;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const tx = cx + r + 12;
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#ffffff";
  ctx.strokeText(text, tx, cy);
  ctx.fillStyle = low ? "#d13030" : "#7a4a1e";
  ctx.fillText(text, tx, cy);
}

/** Combo-Multiplikator oben rechts (nur ab x2 sichtbar). */
function drawMultiplier(
  ctx: CanvasRenderingContext2D,
  combo: number,
  w: number,
): void {
  const mult = comboMultiplier(combo);
  if (mult <= 1) return;
  const text = `x${mult}`;
  ctx.font = HUD_FONT;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const x = w - 40;
  const y = 52;
  ctx.lineWidth = 9;
  ctx.strokeStyle = "#ffffff";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = "#ff8a1e";
  ctx.fillText(text, x, y);
}

// --------------------------------------------------------------------------
// Kapitäns-Kackhaufen: Mütze & Stinkwölkchen
// --------------------------------------------------------------------------

/** Aufsteigende grünliche Duftwölkchen an beiden Seiten – „extra stinkig". */
function drawStinkLines(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  phase: number,
): void {
  ctx.strokeStyle = "rgba(120, 190, 90, 0.8)";
  ctx.lineWidth = Math.max(3, size * 0.03);
  ctx.lineCap = "round";
  const baseY = cy - size * 0.02;
  for (const side of [-1, 1]) {
    const x = cx + side * size * 0.38;
    const wob = Math.sin(phase * Math.PI * 2 + side) * size * 0.06;
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.bezierCurveTo(
      x - size * 0.1 + wob,
      baseY - size * 0.18,
      x + size * 0.1 + wob,
      baseY - size * 0.34,
      x + wob * 0.5,
      baseY - size * 0.5,
    );
    ctx.stroke();
  }
}

/** Weiße Kapitänsmütze mit dunklem Band, Schirm und goldenem Stern-Emblem. */
function drawCaptainHat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
): void {
  const bandY = cy - size * 0.34;
  const bandW = size * 0.5;
  const bandH = size * 0.11;

  // Schirm (schwarz), leicht nach unten/vorne
  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath();
  ctx.ellipse(cx, bandY + bandH * 0.6, bandW * 0.62, size * 0.045, 0, 0, Math.PI * 2);
  ctx.fill();

  // Krone (weiß, rund nach oben gewölbt)
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(cx - bandW / 2, bandY);
  ctx.quadraticCurveTo(cx - bandW * 0.52, bandY - size * 0.24, cx, bandY - size * 0.22);
  ctx.quadraticCurveTo(cx + bandW * 0.52, bandY - size * 0.24, cx + bandW / 2, bandY);
  ctx.closePath();
  ctx.fill();
  // dezente Schattierung an der Kronen-Unterkante
  ellipse(ctx, cx, bandY - size * 0.02, bandW * 0.48, size * 0.03, "#e6ebf2");

  // Band (marineblau)
  ctx.fillStyle = "#16233f";
  ctx.fillRect(cx - bandW / 2, bandY - bandH / 2, bandW, bandH);

  // goldenes Stern-Emblem vorne mittig
  drawStar(ctx, cx, bandY, size * 0.07, "#ffd23f");
}
