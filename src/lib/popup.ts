/**
 * Shared horizontal positioning for anchored popups (tooltips, dropdowns,
 * hover panels) so they never overflow the viewport edges.
 */

export type PopupAlign = "left" | "right" | "center";

/** Decide which side to anchor on based on the trigger's horizontal center. */
export function popupAlign(anchorX: number, popupWidth: number): PopupAlign {
  const halfW = popupWidth / 2;
  if (anchorX + halfW > window.innerWidth) return "right";
  if (anchorX - halfW < 0) return "left";
  return "center";
}

export interface PopupPosition {
  left: number;
  translateX: string;
}

/**
 * Left offset + translate for a popup anchored to a trigger rect.
 * Edge-aligned (trigger's left/right edges, clamped to the viewport)
 * when centered would overflow.
 */
export function popupPosition(
  anchorLeft: number,
  anchorRight: number,
  popupWidth: number,
): PopupPosition {
  const anchorX = (anchorLeft + anchorRight) / 2;
  const align = popupAlign(anchorX, popupWidth);
  let left =
    align === "right"
      ? anchorRight - popupWidth
      : align === "left"
        ? anchorLeft
        : anchorX;
  if (align !== "center") {
    left = Math.max(4, Math.min(left, window.innerWidth - popupWidth - 4));
  }
  return { left, translateX: align === "center" ? "-50%" : "0" };
}

/**
 * Document listeners that close an open popup on Escape or outside
 * pointer-down. Returns a cleanup, so it can be returned from an effect
 * guarded on the open state, keeping the listeners registered only while
 * the popup is visible. `opts.except` lets a toggle trigger that lives
 * outside `host` opt out (its own click handler does the toggling).
 */
export function onDismiss(
  host: HTMLElement | undefined,
  close: () => void,
  opts: { except?: (target: EventTarget | null) => boolean } = {},
): () => void {
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }
  function onPointerDown(e: PointerEvent) {
    if (!host || host.contains(e.target as Node)) return;
    if (opts.except?.(e.target)) return;
    close();
  }
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("pointerdown", onPointerDown);
  return () => {
    document.removeEventListener("keydown", onKeydown);
    document.removeEventListener("pointerdown", onPointerDown);
  };
}
