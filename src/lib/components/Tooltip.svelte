<script lang="ts">
  import type { Snippet } from "svelte";
  import { popupPosition } from "$lib/popup";

  let {
    popup,
    trigger,
    width = "w-64",
    nowrap = false,
    position = "top",
    hostClass = "",
    hostStyle = "",
  }: {
    popup: Snippet;
    trigger: Snippet;
    width?: string;
    nowrap?: boolean;
    position?: "top" | "bottom";
    hostClass?: string;
    hostStyle?: string;
  } = $props();

  let host: HTMLElement | undefined = $state();
  let popupEl: HTMLElement | undefined = $state();
  let tooltipWidth = $state(0);
  let popupHeight = $state(0);
  let hovered = $state(false);
  let focused = $state(false);
  let pinned = $state(false);
  let popupPos = $state({ left: 0, top: 0 });
  let popupTranslate = $state("0");

  /** Hover, keyboard focus, or an explicit pin all keep the popup open. */
  let visible = $derived(hovered || focused || pinned);

  /**
   * Anchor the popup to the host's current viewport rect, clamped to the
   * viewport. Called on interaction and while visible (scroll/resize/size
   * changes) — the popup lives in `position: fixed` space, so it must track
   * the host manually.
   */
  function place() {
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const pos = popupPosition(
      rect.left,
      rect.right,
      tooltipWidth || popupEl?.clientWidth || 0,
    );
    const top = position === "bottom" ? rect.bottom + 10 : rect.top - 10;
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

  // All triggers funnel through the host (events bubble up from the trigger
  // element), so the trigger snippet needs no handlers of its own.
  $effect(() => {
    const el = host;
    if (!el) return;
    function onPointerEnter() {
      hovered = true;
      place();
    }
    function onPointerLeave() {
      hovered = false;
    }
    function onFocusIn() {
      focused = true;
      place();
    }
    function onFocusOut() {
      focused = false;
    }
    function onClick() {
      pinned = !pinned;
      if (pinned) place();
    }
    el.addEventListener("pointerenter", onPointerEnter);
    el.addEventListener("pointerleave", onPointerLeave);
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    el.addEventListener("click", onClick);
    return () => {
      el.removeEventListener("pointerenter", onPointerEnter);
      el.removeEventListener("pointerleave", onPointerLeave);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
      el.removeEventListener("click", onClick);
    };
  });

  // Teleport the popup to <body>: no ancestor stacking context (transformed
  // cards, sticky columns) or overflow clip can trap or clip it, and its
  // z-index then competes globally instead of inside some local context.
  $effect(() => {
    const el = popupEl;
    if (!el) return;
    document.body.appendChild(el);
  });

  // Re-anchor while visible: the popup is fixed-positioned, so it must track
  // the host's rect on scroll/resize — and when its own size settles after
  // mount. Listeners exist only while visible, so the dense grids never pay
  // for them until a tooltip actually opens.
  $effect(() => {
    if (!host || !visible) return;
    void tooltipWidth;
    void popupHeight;
    place();
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place, { passive: true });
    return () => {
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  });

  // Close the pin on outside click or Escape.
  $effect(() => {
    if (!pinned) return;
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
</script>

<div
  bind:this={host}
  class="relative inline-block cursor-default {hostClass}"
  style={hostStyle}
>
  {#if visible}
    <div
      bind:this={popupEl}
      bind:clientWidth={tooltipWidth}
      bind:clientHeight={popupHeight}
      role="tooltip"
      class="pointer-events-none fixed z-[9999] rounded-xl border p-3 text-left text-[11px] leading-relaxed shadow-2xl {width} {nowrap
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
  {@render trigger()}
</div>
