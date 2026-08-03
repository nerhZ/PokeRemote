<script lang="ts">
  import { onMount } from "svelte";
  import {
    ALL_TYPES,
    TYPE_CHART,
    TYPE_COLORS,
    formatName,
  } from "$lib/pokemon-types";
  import TypePopup from "$lib/components/TypePopup.svelte";

  let popupVisible = $state(false);
  let popupType = $state("");
  let popupDir = $state<"top" | "bottom">("top");
  let popupPos = $state({ left: 0, top: 0 });

  let heroRef = $state<HTMLElement | undefined>();
  let legendRef = $state<HTMLElement | undefined>();
  let headerHeight = $state(40);
  let rowHeight = $state(36);
  let cellFont = $state(13);
  let labelFont = $state(10);

  function measure() {
    const header =
      document.querySelector("header")?.getBoundingClientRect().height ?? 0;
    const footer =
      document.querySelector("footer")?.getBoundingClientRect().height ?? 0;
    const heroH = heroRef?.getBoundingClientRect().height ?? 0;
    const legendH = legendRef?.getBoundingClientRect().height ?? 0;
    // fixed spacing: page py (16) + hero mb (12) + legend mt (12) + chart borders (2)
    const avail = window.innerHeight - header - footer - heroH - legendH - 42;
    headerHeight = Math.min(52, Math.max(30, Math.round(avail * 0.06)));
    rowHeight = Math.max(22, Math.floor((avail - headerHeight) / 18));
    cellFont = Math.min(16, Math.max(11, Math.round(rowHeight * 0.5)));
    labelFont = Math.min(13, Math.max(9, Math.round(rowHeight * 0.42)));
    // safety: if the document still overflows, shrink rows to fit exactly
    requestAnimationFrame(() => {
      const overflow =
        document.documentElement.scrollHeight - window.innerHeight;
      if (overflow > 1) {
        rowHeight = Math.max(22, rowHeight - Math.ceil(overflow / 18));
      }
    });
  }

  onMount(() => {
    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  });

  function showPopup(e: MouseEvent, type: string, dir: "top" | "bottom") {
    popupType = type;
    popupDir = dir;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    popupPos =
      dir === "bottom"
        ? { left: rect.left + rect.width / 2, top: rect.bottom + 10 }
        : { left: rect.left + rect.width / 2, top: rect.top - 10 };
    popupVisible = true;
  }

  function togglePopup(e: MouseEvent, type: string, dir: "top" | "bottom") {
    if (popupVisible && popupType === type) {
      hidePopup();
      return;
    }
    showPopup(e, type, dir);
  }

  function hidePopup() {
    popupVisible = false;
  }

  function multOf(att: string, def: string): number {
    return TYPE_CHART[att]?.[def] ?? 1;
  }

  function multLabel(m: number): string {
    if (m === 0) return "0×";
    if (m === 0.25) return "¼×";
    if (m === 0.5) return "½×";
    if (m === 2) return "2×";
    if (m === 4) return "4×";
    return "1×";
  }

  function cellClass(m: number): string {
    if (m === 0) return "bg-black/50 text-white/40";
    if (m >= 2) return "bg-pokemon-red/25 text-pokemon-red";
    if (m < 1) return "bg-pokemon-green/25 text-pokemon-green";
    return "text-white/30";
  }
</script>

<div class="px-4 py-2 md:px-6">
  <div bind:this={heroRef} class="tool-hero mx-auto mb-3 max-w-7xl">
    <h1 class="text-2xl md:text-3xl">Type Chart</h1>
    <p class="text-xs md:text-sm">
      Effectiveness when the row type attacks the column type. Hover a row for
      details.
    </p>
  </div>

  <div
    class="mx-auto w-full overflow-x-auto rounded-2xl border"
    style="border-color: var(--border)"
  >
    <div
      class="grid min-w-260"
      style="grid-template-columns: 8.5rem repeat(18, minmax(3.25rem, 1fr));"
    >
      <div
        class="sticky left-0 z-10 p-2"
        style="background: var(--card); height: {headerHeight}px"
      ></div>
      {#each ALL_TYPES as def}
        <button
          type="button"
          class="flex cursor-default items-end justify-center pb-1.5"
          style="height: {headerHeight}px; font-size: {labelFont}px"
          title={formatName(def)}
          onpointerenter={(e) => showPopup(e, def, "bottom")}
          onpointerleave={hidePopup}
          onclick={(e) => togglePopup(e, def, "bottom")}
        >
          <span class="font-bold tracking-wide uppercase"
            >{formatName(def)}</span
          >
        </button>
      {/each}
      {#each ALL_TYPES as att}
        <button
          type="button"
          class="sticky left-0 z-10 flex cursor-default items-center gap-1.5 border-y border-white/4 px-2"
          style="background: var(--card); height: {rowHeight}px; font-size: {labelFont}px"
          onpointerenter={(e) => showPopup(e, att, "top")}
          onpointerleave={hidePopup}
          onclick={(e) => togglePopup(e, att, "top")}
        >
          <span
            class="h-2.5 w-2.5 shrink-0 rounded-full"
            style="background: {TYPE_COLORS[att]}"
          ></span>
          <span class="truncate font-bold uppercase">{formatName(att)}</span>
        </button>
        {#each ALL_TYPES as def}
          {@const m = multOf(att, def)}
          <div
            class="flex items-center justify-center font-bold {cellClass(m)}"
            style="height: {rowHeight}px; font-size: {cellFont}px"
            title="{formatName(att)} vs {formatName(def)}: {multLabel(m)}"
          >
            {multLabel(m)}
          </div>
        {/each}
      {/each}
    </div>
  </div>

  {#if popupVisible}
    <div
      class="pointer-events-none fixed z-100 w-max max-w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border p-3 text-left text-[11px] leading-relaxed shadow-2xl {popupDir ===
      'top'
        ? '-translate-y-full'
        : ''}"
      style="left: {popupPos.left}px; top: {popupPos.top}px; background: var(--card); border-color: var(--border); color: var(--muted-strong);"
    >
      <TypePopup type={popupType} />
    </div>
  {/if}

  <div
    bind:this={legendRef}
    class="mx-auto mt-3 flex w-full flex-wrap items-center gap-x-5 gap-y-2 text-[11px]"
    style="color: var(--muted)"
  >
    <span class="flex items-center gap-1.5"
      ><span class="bg-pokemon-red/40 h-2.5 w-2.5 rounded-sm"></span> Super effective
      (2× / 4×)</span
    >
    <span class="flex items-center gap-1.5"
      ><span class="bg-pokemon-green/40 h-2.5 w-2.5 rounded-sm"></span> Not very effective
      (½× / ¼×)</span
    >
    <span class="flex items-center gap-1.5"
      ><span class="h-2.5 w-2.5 rounded-sm bg-black/50"></span> No effect (0×)</span
    >
    <span class="flex items-center gap-1.5"
      ><span class="h-2.5 w-2.5 rounded-sm border border-white/25"></span> Neutral
      (1×)</span
    >
  </div>
</div>
