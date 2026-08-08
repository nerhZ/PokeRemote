<script lang="ts">
  import type { Snippet } from "svelte";
  import { popupAlign, popupPosition, type PopupAlign } from "$lib/popup";

  /** Handlers the trigger snippet should spread onto its element in `fixed` mode. */
  export type TooltipHandlers = {
    onpointerenter: () => void;
    onpointerleave: () => void;
    onclick: () => void;
  };

  let {
    popup,
    trigger,
    width = "w-64",
    nowrap = false,
    position = "top",
    fixed = false,
    interactive = false,
    hostClass = "",
    hostStyle = "",
  }: {
    popup: Snippet;
    trigger: Snippet<[TooltipHandlers]>;
    width?: string;
    nowrap?: boolean;
    position?: "top" | "bottom";
    /** Position the popup with `fixed` coordinates (escapes overflow clipping; needs JS visibility). */
    fixed?: boolean;
    /** In fixed mode, clicking the trigger pins the popup open (closes on outside click / Escape). */
    interactive?: boolean;
    hostClass?: string;
    hostStyle?: string;
  } = $props();

  let host: HTMLElement | undefined = $state();
  let popupEl: HTMLElement | undefined = $state();
  let tooltipWidth = $state(0);
  let popupHeight = $state(0);
  let align = $state<PopupAlign>("center");
  let visible = $state(false);
  let pinned = $state(false);
  let popupPos = $state({ left: 0, top: 0 });
  let popupTranslate = $state("0");

  /**
   * Recompute the side-anchoring for the popup. Uses the live popup width
   * (the clientWidth binding lags a frame, and a zero width would leave the
   * popup centered — overflowing the viewport for edge-adjacent triggers).
   */
  function updateAlign() {
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const w = popupEl?.clientWidth || tooltipWidth || 0;
    align = popupAlign(rect.left + rect.width / 2, w);
    if (fixed && visible) placeFixed();
  }

  function placeFixed() {
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const pos = popupPosition(rect.left, rect.right, tooltipWidth);
    const top = position === "bottom" ? rect.bottom + 10 : rect.top - 10;
    // Keep the popup inside the viewport: top-positioned popups extend upward
    // (translate -100%), bottom-positioned ones extend downward from the anchor.
    const minTop = 8;
    const maxTop =
      position === "bottom"
        ? window.innerHeight - 8 - popupHeight
        : window.innerHeight - 8;
    popupPos = {
      left: pos.left,
      top: Math.max(minTop, Math.min(top, maxTop)),
    };
    popupTranslate = pos.translateX;
  }

  const handlers: TooltipHandlers = {
    onpointerenter: () => {
      if (!fixed) return;
      placeFixed();
      visible = true;
    },
    onpointerleave: () => {
      visible = false;
    },
    onclick: () => {
      if (!interactive) return;
      visible = !visible;
      if (visible) placeFixed();
    },
  };

  // Non-fixed tooltips are pure CSS (hover + focus-within + .pinned). Clicking
  // the host pins them open — this gives touch users and keyboard users a
  // tap-toggle instead of hover-only discovery. Attached imperatively so the
  // host div stays non-interactive in the template (the trigger owns the
  // interactive semantics).
  $effect(() => {
    if (fixed) return;
    const el = host;
    if (!el) return;
    function onHostClick() {
      pinned = !pinned;
    }
    el.addEventListener("click", onHostClick);
    return () => el.removeEventListener("click", onHostClick);
  });

  $effect(() => {
    if (!host) return;
    void tooltipWidth;
    void popupHeight;
    void visible;

    updateAlign();
    // Only fixed-position popups need window tracking — non-fixed popups are
    // absolutely positioned inside the host, so they follow it automatically.
    // (On the dense Pokédex/moves grids this avoids thousands of scroll
    // listeners firing getBoundingClientRect on every scroll.)
    if (!fixed) return;
    window.addEventListener("scroll", updateAlign, { passive: true });
    window.addEventListener("resize", updateAlign, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateAlign);
      window.removeEventListener("resize", updateAlign);
    };
  });

  // Non-fixed popups are hover/focus/pin-driven CSS, so alignment must be
  // correct by the time the user interacts — recompute at that moment (the
  // mount-time computation can be stale: width binding not fired yet, cards
  // still entering the grid, etc.).
  $effect(() => {
    if (fixed) return;
    const el = host;
    if (!el) return;
    el.addEventListener("pointerenter", updateAlign);
    el.addEventListener("pointerdown", updateAlign);
    el.addEventListener("focusin", updateAlign);
    return () => {
      el.removeEventListener("pointerenter", updateAlign);
      el.removeEventListener("pointerdown", updateAlign);
      el.removeEventListener("focusin", updateAlign);
    };
  });

  $effect(() => {
    if (fixed || !pinned) return;
    function onPointerDown(e: PointerEvent) {
      if (host && !host.contains(e.target as Node)) pinned = false;
    }
    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") pinned = false;
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeydown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeydown);
    };
  });

  $effect(() => {
    if (!fixed || !interactive || !visible) return;
    function onPointerDown(e: PointerEvent) {
      if (host && !host.contains(e.target as Node)) visible = false;
    }
    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") visible = false;
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeydown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeydown);
    };
  });

  let positionClass = $derived.by(() => {
    const vert =
      position === "bottom" ? "top-full mt-1.5" : "bottom-full mb-1.5";
    if (align === "right") return `${vert} left-auto right-0 translate-x-0`;
    if (align === "left") return `${vert} left-0 right-auto translate-x-0`;
    return `${vert} left-1/2 -translate-x-1/2`;
  });
</script>

<div
  bind:this={host}
  class="tooltip-host relative {fixed
    ? ''
    : 'inline-block'} cursor-default {hostClass}"
  class:pinned
  style={hostStyle}
>
  {#if fixed}
    {#if visible}
      <div
        bind:clientWidth={tooltipWidth}
        bind:clientHeight={popupHeight}
        class="pointer-events-none fixed z-100 rounded-xl border p-3 text-left text-[11px] leading-relaxed shadow-2xl {width} {nowrap
          ? 'whitespace-nowrap'
          : 'whitespace-normal'}"
        style="left: {popupPos.left}px; top: {popupPos.top}px; transform: translate({popupTranslate}, {position ===
        'top'
          ? '-100%'
          : '0'}); background: var(--card); border-color: var(--border); color: var(--muted-strong);"
      >
        {@render popup()}
      </div>
    {/if}
  {:else}
    <div
      bind:this={popupEl}
      bind:clientWidth={tooltipWidth}
      class="tooltip-content absolute z-100 rounded-xl border p-3 text-left text-[11px] leading-relaxed shadow-2xl {positionClass} {width} {nowrap
        ? 'whitespace-nowrap'
        : 'whitespace-normal'}"
      style="background: var(--card); border-color: var(--border); color: var(--muted-strong);"
    >
      {@render popup()}
    </div>
  {/if}
  {@render trigger(handlers)}
</div>
