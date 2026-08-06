<script lang="ts">
  import {
    ALL_TYPES,
    TYPE_CHART,
    TYPE_COLORS,
    formatName,
    multiplierLabel,
  } from "$lib/pokemon-types";
  import Tooltip from "$lib/components/Tooltip.svelte";
  import TypePopup from "$lib/components/TypePopup.svelte";
  import FitViewport from "$lib/components/FitViewport.svelte";

  let heroRef = $state<HTMLElement | undefined>();
  let legendRef = $state<HTMLElement | undefined>();
  let headerHeight = $state(40);
  let rowHeight = $state(36);
  let cellFont = $state(13);
  let labelFont = $state(10);

  /** Size the chart rows to the available viewport space (via FitViewport). */
  function fitChart(pageH: number) {
    const heroH = heroRef?.getBoundingClientRect().height ?? 0;
    const legendH = legendRef?.getBoundingClientRect().height ?? 0;
    // fixed spacing: page py (16) + hero mb (12) + legend mt (12) + chart borders (2)
    const avail = pageH - heroH - legendH - 42;
    headerHeight = Math.min(52, Math.max(30, Math.round(avail * 0.06)));
    rowHeight = Math.max(22, Math.floor((avail - headerHeight) / 18));
    cellFont = Math.min(16, Math.max(11, Math.round(rowHeight * 0.5)));
    labelFont = Math.min(13, Math.max(9, Math.round(rowHeight * 0.42)));
  }

  /** Safety: if the document still overflows, shrink rows to fit exactly. */
  function shrinkChart(px: number) {
    rowHeight = Math.max(22, rowHeight - Math.ceil(px / 18));
  }

  function multOf(att: string, def: string): number {
    return TYPE_CHART[att]?.[def] ?? 1;
  }

  function cellClass(m: number): string {
    if (m === 0) return "bg-black/50 text-white/40";
    if (m >= 2) return "bg-pokemon-red/25 text-pokemon-red";
    if (m < 1) return "bg-pokemon-green/25 text-pokemon-green";
    return "text-white/30";
  }
</script>

<FitViewport
  class="px-4 py-2 md:px-6"
  onMeasure={fitChart}
  onOverflow={shrinkChart}
>
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
        <Tooltip
          fixed
          interactive
          position="bottom"
          width="w-max max-w-[min(24rem,calc(100vw-2rem))]"
          hostClass="flex items-end justify-center pb-1.5"
          hostStyle="height: {headerHeight}px"
        >
          {#snippet popup()}
            <TypePopup type={def} />
          {/snippet}
          {#snippet trigger(handlers)}
            <button
              type="button"
              {...handlers}
              class="cursor-default"
              style="font-size: {labelFont}px"
              title={formatName(def)}
            >
              <span
                class="font-bold tracking-wide uppercase"
                style="color: {TYPE_COLORS[def]}">{formatName(def)}</span
              >
            </button>
          {/snippet}
        </Tooltip>
      {/each}
      {#each ALL_TYPES as att}
        <Tooltip
          fixed
          interactive
          position="top"
          width="w-max max-w-[min(24rem,calc(100vw-2rem))]"
          hostClass="sticky left-0 z-10 border-y border-white/4 bg-(--card)"
          hostStyle="height: {rowHeight}px"
        >
          {#snippet popup()}
            <TypePopup type={att} />
          {/snippet}
          {#snippet trigger(handlers)}
            <button
              type="button"
              {...handlers}
              class="flex h-full w-full cursor-default items-center px-2"
              style="font-size: {labelFont}px"
            >
              <span
                class="truncate font-bold uppercase"
                style="color: {TYPE_COLORS[att]}">{formatName(att)}</span
              >
            </button>
          {/snippet}
        </Tooltip>
        {#each ALL_TYPES as def}
          {@const m = multOf(att, def)}
          <div
            class="flex items-center justify-center font-bold {cellClass(m)}"
            style="height: {rowHeight}px; font-size: {cellFont}px"
            title="{formatName(att)} vs {formatName(def)}: {multiplierLabel(m)}"
          >
            {multiplierLabel(m)}
          </div>
        {/each}
      {/each}
    </div>
  </div>

  <div
    bind:this={legendRef}
    class="mx-auto mt-3 flex w-full flex-wrap items-center gap-x-5 gap-y-2 text-[11px]"
    style="color: var(--muted)"
  >
    <span class="flex items-center gap-1.5"
      ><span class="bg-pokemon-red/40 h-2.5 w-2.5 rounded-sm"></span> Super effective
      (2×)</span
    >
    <span class="flex items-center gap-1.5"
      ><span class="bg-pokemon-green/40 h-2.5 w-2.5 rounded-sm"></span> Not very effective
      (½×)</span
    >
    <span class="flex items-center gap-1.5"
      ><span class="h-2.5 w-2.5 rounded-sm bg-black/50"></span> No effect (0×)</span
    >
    <span class="flex items-center gap-1.5"
      ><span class="h-2.5 w-2.5 rounded-sm border border-white/25"></span> Neutral
      (1×)</span
    >
    <span class="basis-full"
      >Single-type matchups cap at 2× / ½× — 4× / ¼× only happens against
      dual-type defenders.</span
    >
  </div>
</FitViewport>
