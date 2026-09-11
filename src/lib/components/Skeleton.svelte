<script lang="ts">
  import * as stylex from "@stylexjs/stylex";
  import type { BoxSx } from "$lib/styles/stylex-types";
  import { styles } from "./Skeleton.styles";

  const BP = { sm: 640, lg: 1024 };

  let {
    rows = 1,
    sx,
    grid = true,
    tiles = false,
    cols = 3,
  }: {
    rows?: number;
    sx?: BoxSx;
    grid?: boolean;
    /** Bare tiles without a wrapper grid; drop them into an existing grid so
        they flow into its partial last row instead of leaving holes. */
    tiles?: boolean;
    cols?: 2 | 3;
  } = $props();

  const tiers = $derived(
    cols === 2
      ? [{ width: BP.sm, cols: 2 }]
      : [
          { width: BP.sm, cols: 2 },
          { width: BP.lg, cols: 3 },
        ],
  );

  let activeCols = $state(1);

  // Track the column count for the current viewport so a partial final row can
  // be filled in; loading grids never show holes (nor over-fill), matching
  // the content grid's height exactly at every breakpoint.
  $effect(() => {
    if (!grid || tiles) {
      activeCols = 1;
      return;
    }
    const mqls = tiers.map((t) => ({
      cols: t.cols,
      mql: window.matchMedia(`(min-width: ${t.width}px)`),
    }));
    const update = () => {
      let count = 1;
      for (const { cols: c, mql } of mqls) if (mql.matches) count = c;
      activeCols = count;
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
    <div {...stylex.attrs(styles.tile, sx)}></div>
  {/each}
{:else if grid}
  <div {...stylex.attrs(styles.grid, cols === 2 ? styles.cols2 : styles.cols3)}>
    {#each Array(filledRows) as _}
      <div {...stylex.attrs(styles.tile, sx)}></div>
    {/each}
  </div>
{:else}
  <div {...stylex.attrs(styles.stack)}>
    {#each Array(rows) as _}
      <div {...stylex.attrs(styles.tile, sx)}></div>
    {/each}
  </div>
{/if}
