<script module lang="ts">
  // A single tooltip may be visible at a time across the whole app: opening
  // one (hover, focus, or pin) releases whichever tooltip held the claim
  // before it. Holds the owning tooltip's release callback.
  let activeRelease: (() => void) | null = null;

  // Second guard rail, at the DOM level: popups are teleported to <body>, so
  // before mounting a new one, drop any stray popup node a leaked tooltip
  // left behind. Duplicates are then impossible even if a state path fails.
  let activePopupEl: HTMLElement | null = null;
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import { onDismiss, popupPosition } from "$lib/popup";

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
   * changes). The popup lives in `position: fixed` space, so it must track
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

  /** Close this tooltip fully and give up the global visibility claim. */
  function release() {
    hovered = false;
    focused = false;
    pinned = false;
    if (activeRelease === release) activeRelease = null;
  }

  /** Opening this tooltip closes whichever other tooltip is visible. */
  function claimVisible() {
    if (activeRelease === release) return;
    activeRelease?.();
    activeRelease = release;
  }

  /** Give up the claim when this tooltip is no longer visible. */
  function dropClaimIfHidden() {
    if (!visible && activeRelease === release) activeRelease = null;
  }

  // All triggers funnel through the host (events bubble up from the trigger
  // element), so the trigger snippet needs no handlers of its own.
  $effect(() => {
    const el = host;
    if (!el) return;
    function onPointerEnter() {
      hovered = true;
      claimVisible();
      place();
    }
    function onPointerLeave() {
      hovered = false;
      dropClaimIfHidden();
    }
    function onFocusIn() {
      focused = true;
      claimVisible();
      place();
    }
    function onFocusOut() {
      focused = false;
      dropClaimIfHidden();
    }
    function onClick() {
      if (pinned) {
        // Toggle off, but stay open under the cursor via hover/focus.
        pinned = false;
      } else {
        pinned = true;
        claimVisible();
        place();
      }
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
      // Unmounting must not leave a stale claim behind.
      if (activeRelease === release) activeRelease = null;
    };
  });

  // Teleport the popup to <body>: no ancestor stacking context (transformed
  // cards, sticky columns) or overflow clip can trap or clip it, and its
  // z-index then competes globally instead of inside some local context.
  // The cleanup matters: navigating away while pinned (e.g. clicking a type
  // badge inside a card link) unmounts the component, and without explicit
  // removal the teleported node would stay behind as a visible orphan.
  $effect(() => {
    const el = popupEl;
    if (!el) return;
    activePopupEl?.remove();
    activePopupEl = el;
    document.body.appendChild(el);
    return () => {
      if (activePopupEl === el) activePopupEl = null;
      el.remove();
    };
  });

  // Re-anchor while visible: the popup is fixed-positioned, so it must track
  // the host's rect on scroll/resize and when its own size settles after
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

  // Close on outside click or Escape while visible (not just when pinned).
  $effect(() => {
    if (!host || !visible) return;
    return onDismiss(host, release);
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
