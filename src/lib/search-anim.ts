/**
 * One-shot notification when the header's mobile search-bar collapse
 * animation finishes, so pages can defer heavy main-thread work (e.g. the
 * Pokédex catalog parse) until it has. The rAF loop is frame-count based,
 * so its real duration varies with refresh rate — a fixed delay would not.
 */

let running = false;
const listeners = new Set<() => void>();

export function collapseStarted() {
  running = true;
}

export function collapseFinished() {
  if (!running) return;
  running = false;
  for (const fn of listeners) fn();
  listeners.clear();
}

/** Runs `fn` once the running collapse (if any) finishes, else immediately.
    Returns an unsubscribe function. */
export function onCollapseFinished(fn: () => void): () => void {
  if (!running) {
    fn();
    return () => {};
  }
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
