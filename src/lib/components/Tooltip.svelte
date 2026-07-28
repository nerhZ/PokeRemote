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

  let positionClass = $derived(
    position === "bottom"
      ? "top-full left-1/2 -translate-x-1/2 mt-1.5"
      : "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
  );
</script>

<div class="tooltip-host relative inline-block cursor-default">
  <div
    class="tooltip-content pointer-events-none absolute z-[100] rounded-xl border p-3 text-left text-[11px] leading-relaxed shadow-2xl {positionClass} {width} {nowrap
      ? 'whitespace-nowrap'
      : ''}"
    style="background: var(--card); border-color: var(--border); color: var(--muted-strong);"
  >
    {@render popup()}
  </div>
  {@render trigger()}
</div>
