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
  let tooltipWidth = $state(0);
  let popupHeight = $state(0);
  let align = $state<PopupAlign>("center");
  let visible = $state(false);
  let popupPos = $state({ left: 0, top: 0 });
  let popupTranslate = $state("0");

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

  $effect(() => {
    if (!host) return;
    void tooltipWidth;
    void popupHeight;
    void visible;

    function update() {
      if (!host) return;
      const rect = host.getBoundingClientRect();
      align = popupAlign(rect.left + rect.width / 2, tooltipWidth);
      if (fixed && visible) placeFixed();
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
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
