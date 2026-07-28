<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    popup,
    trigger,
    width = "w-64",
    nowrap = false,
    position = "top",
  }: {
    popup: Snippet;
    trigger: Snippet;
    width?: string;
    nowrap?: boolean;
    position?: "top" | "bottom";
  } = $props();

  let host: HTMLElement | undefined = $state();
  let tooltipWidth = $state(0);
  let align = $state<"center" | "left" | "right">("center");

  $effect(() => {
    if (!host) return;
    void tooltipWidth;

    function update() {
      if (!host) return;
      const rect = host.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const halfW = tooltipWidth / 2;

      if (center + halfW > window.innerWidth) {
        align = "right";
      } else if (center - halfW < 0) {
        align = "left";
      } else {
        align = "center";
      }
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
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

<div bind:this={host} class="tooltip-host relative inline-block cursor-default">
  <div
    bind:clientWidth={tooltipWidth}
    class="tooltip-content absolute z-[100] rounded-xl border p-3 text-left text-[11px] leading-relaxed shadow-2xl {positionClass} {width} max-w-[min(24rem,calc(100vw-2rem))] {nowrap
      ? 'whitespace-nowrap'
      : 'whitespace-normal'}"
    style="background: var(--card); border-color: var(--border); color: var(--muted-strong);"
  >
    {@render popup()}
  </div>
  {@render trigger()}
</div>
