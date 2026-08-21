/** Restrict a number to the [min, max] range. */
export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Set a boolean flag true, auto-resetting it after `ms` (e.g. "Copied!" feedback). */
export function flash(set: (value: boolean) => void, ms = 2000): void {
  set(true);
  setTimeout(() => set(false), ms);
}
