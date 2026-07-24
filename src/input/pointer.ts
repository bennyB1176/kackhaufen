import type { World } from "../game/types";

export interface ViewTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Berechnet die Letterbox-Transformation, um die Welt (Querformat)
 * mittig und ohne Verzerrung in die Canvas zu passen.
 */
export function computeView(
  world: World,
  canvasWidth: number,
  canvasHeight: number,
): ViewTransform {
  const scale = Math.min(canvasWidth / world.width, canvasHeight / world.height);
  return {
    scale,
    offsetX: (canvasWidth - world.width * scale) / 2,
    offsetY: (canvasHeight - world.height * scale) / 2,
  };
}

/** Rechnet einen Bildschirm-Tap in Spielkoordinaten um. */
export function screenToWorld(
  view: ViewTransform,
  screenX: number,
  screenY: number,
): { x: number; y: number } {
  return {
    x: (screenX - view.offsetX) / view.scale,
    y: (screenY - view.offsetY) / view.scale,
  };
}

/**
 * Registriert einen Tap-/Klick-Handler auf dem Canvas. Der Callback
 * bekommt bereits umgerechnete Spielkoordinaten.
 */
export function attachTap(
  canvas: HTMLCanvasElement,
  getView: () => ViewTransform,
  onTap: (x: number, y: number) => void,
): void {
  canvas.addEventListener(
    "pointerdown",
    (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const sy = ((e.clientY - rect.top) / rect.height) * canvas.height;
      const { x, y } = screenToWorld(getView(), sx, sy);
      onTap(x, y);
    },
    { passive: false },
  );
}
