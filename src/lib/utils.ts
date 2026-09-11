/** Restrict a number to the [min, max] range. */
export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Set a boolean flag true, auto-resetting it after `ms` (e.g. "Copied!" feedback). */
export function flash(set: (value: boolean) => void, ms = 2000): void {
  set(true);
  setTimeout(() => set(false), ms);
}

/**
 * Text color that flips between dark and light for legibility on `color`,
 * toned toward it so it reads softer than pure black/white.
 */
export function contrastText(color: string): string {
  return `color-mix(in srgb, contrast-color(${color}) 80%, ${color})`;
}
