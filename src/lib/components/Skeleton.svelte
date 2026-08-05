<script lang="ts">
  const BP_WIDTHS: Record<string, number> = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  };

  let {
    rows = 1,
    class: klass = "h-24",
    grid = true,
    tiles = false,
    cols = "sm:grid-cols-2 lg:grid-cols-3",
  }: {
    rows?: number;
    class?: string;
    grid?: boolean;
    /** Bare tiles without a wrapper grid — drop them into an existing grid so
        they flow into its partial last row instead of leaving holes. */
    tiles?: boolean;
    cols?: string;
  } = $props();

  const colTiers = $derived.by(() => {
    const tiers: { bp: string | null; cols: number }[] = [];
    let unsupported = false;
    for (const m of cols.matchAll(/(?:^|\s)(?:([\w-]+):)?grid-cols-(\d+)/g)) {
      const prefix = m[1] ?? null;
      if (prefix !== null && !(prefix in BP_WIDTHS)) {
        unsupported = true;
        continue;
      }
      tiers.push({ bp: prefix, cols: parseInt(m[2], 10) });
    }
    return { tiers, unsupported };
  });

  const baseCols = $derived(
    colTiers.tiers.find((t) => t.bp === null)?.cols ?? 1,
  );

  let activeCols = $state(1);

  // Track the column count for the current viewport so a partial final row can
  // be filled in — loading grids never show holes (nor over-fill), matching
  // the content grid's height exactly at every breakpoint.
  $effect(() => {
    if (!grid || tiles) {
      activeCols = 1;
      return;
    }
    if (colTiers.unsupported) {
      console.warn(
        `Skeleton: unsupported grid-cols breakpoint in cols="${cols}" — row fill disabled`,
      );
      activeCols = 1;
      return;
    }
    // Ascending by breakpoint width: all queries are cumulative min-widths, so
    // the last match is the widest tier — independent of cols string order.
    const mqls = colTiers.tiers
      .filter((t) => t.bp !== null)
      .sort((a, b) => BP_WIDTHS[a.bp!] - BP_WIDTHS[b.bp!])
      .map((t) => ({
        cols: t.cols,
        mql: window.matchMedia(`(min-width: ${BP_WIDTHS[t.bp!]}px)`),
      }));
    const update = () => {
      let cols = baseCols;
      for (const { cols: c, mql } of mqls) if (mql.matches) cols = c;
      activeCols = cols;
    };
    update();
    for (const { mql } of mqls) mql.addEventListener("change", update);
    return () => {
      for (const { mql } of mqls) mql.removeEventListener("change", update);
    };
  });

  const filledRows = $derived(
    grid && activeCols > 1 ? Math.ceil(rows / activeCols) * activeCols : rows,
  );
</script>

{#if tiles}
  {#each Array(rows) as _}
    <div class="animate-pulse rounded-2xl bg-white/3 {klass}"></div>
  {/each}
{:else if grid}
  <div class="grid grid-cols-1 gap-3 {cols}">
    {#each Array(filledRows) as _}
      <div class="animate-pulse rounded-2xl bg-white/3 {klass}"></div>
    {/each}
  </div>
{:else}
  <div class="space-y-2">
    {#each Array(rows) as _}
      <div class="animate-pulse rounded-2xl bg-white/3 {klass}"></div>
    {/each}
  </div>
{/if}
