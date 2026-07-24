/**
 * Kleine, fröhliche Soundeffekte – komplett per Web Audio synthetisiert,
 * ohne externe Dateien. Der AudioContext wird erst beim ersten Nutzer-Tap
 * gestartet (Autoplay-Richtlinien der Browser).
 */
let ctx: AudioContext | null = null;

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Beim ersten Tap aufrufen, um Audio freizuschalten. */
export function unlockAudio(): void {
  ensureContext();
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType,
  startAt = 0,
  gain = 0.15,
): void {
  const ac = ensureContext();
  if (!ac) return;
  const t0 = ac.currentTime + startAt;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** Fröhlicher Aufwärts-„Ploink" beim Treffer. */
export function playHit(): void {
  tone(523, 0.12, "triangle", 0); // C5
  tone(784, 0.16, "triangle", 0.08); // G5
  tone(1046, 0.2, "triangle", 0.16); // C6
}

/** Sanfter, tiefer Ton beim Fehltreffer (nicht bedrohlich für Kinder). */
export function playMiss(): void {
  tone(220, 0.18, "sine", 0, 0.12);
  tone(160, 0.22, "sine", 0.1, 0.12);
}

/** Fröhliche kleine Fanfare am Rundenende (Game-Over / neuer Rekord). */
export function playCheer(): void {
  const notes = [523, 659, 784, 1046]; // C5, E5, G5, C6
  notes.forEach((f, i) => tone(f, 0.22, "triangle", i * 0.11, 0.16));
}
