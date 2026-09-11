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
  import * as stylex from "@stylexjs/stylex";
  import { shared } from "$lib/styles/shared.stylex";
  import { dynamic } from "../../lib/styles/dynamic.stylex";
  import { styles } from "./styles";

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

  function cellStyle(m: number) {
    if (m === 0) return styles.cellZero;
    if (m >= 2) return styles.cellSuper;
    if (m < 1) return styles.cellResist;
    return styles.cellNeutral;
  }
</script>

<FitViewport sx={styles.shell} onMeasure={fitChart} onOverflow={shrinkChart}>
  <div bind:this={heroRef} {...stylex.attrs(shared.toolHero, styles.hero)}>
    <h1 {...stylex.attrs(shared.toolHeroTitle, styles.title)}>Type Chart</h1>
    <p {...stylex.attrs(shared.toolHeroText, styles.subtitle)}>
      Effectiveness when the row type attacks the column type. Hover a row for
      details.
    </p>
  </div>

  <div {...stylex.attrs(styles.scroll)}>
    <div {...stylex.attrs(styles.grid)}>
      <div
        {...stylex.attrs(styles.corner, dynamic.height(`${headerHeight}px`))}
      ></div>
      {#each ALL_TYPES as def}
        <Tooltip
          position="bottom"
          popupSx={styles.chartTooltip}
          hostSx={[styles.chartHeader, dynamic.height(`${headerHeight}px`)]}
        >
          {#snippet popup()}
            <TypePopup type={def} />
          {/snippet}
          {#snippet trigger()}
            <button
              type="button"
              {...stylex.attrs(
                styles.headerButton,
                dynamic.fontSize(`${labelFont}px`),
              )}
              title={formatName(def)}
            >
              <span
                {...stylex.attrs(
                  styles.headerLabel,
                  dynamic.color(TYPE_COLORS[def]),
                )}>{formatName(def)}</span
              >
            </button>
          {/snippet}
        </Tooltip>
      {/each}
      {#each ALL_TYPES as att}
        <Tooltip
          position="top"
          popupSx={styles.chartTooltip}
          hostSx={[styles.chartRow, dynamic.height(`${rowHeight}px`)]}
        >
          {#snippet popup()}
            <TypePopup type={att} />
          {/snippet}
          {#snippet trigger()}
            <button
              type="button"
              {...stylex.attrs(
                styles.rowButton,
                dynamic.fontSize(`${labelFont}px`),
              )}
            >
              <span
                {...stylex.attrs(
                  styles.rowLabel,
                  dynamic.color(TYPE_COLORS[att]),
                )}>{formatName(att)}</span
              >
            </button>
          {/snippet}
        </Tooltip>
        {#each ALL_TYPES as def}
          {@const m = multOf(att, def)}
          <div
            {...stylex.attrs(
              styles.cell,
              cellStyle(m),
              dynamic.height(`${rowHeight}px`),
              dynamic.fontSize(`${cellFont}px`),
            )}
            title="{formatName(att)} vs {formatName(def)}: {multiplierLabel(m)}"
          >
            {multiplierLabel(m)}
          </div>
        {/each}
      {/each}
    </div>
  </div>

  <div bind:this={legendRef} {...stylex.attrs(styles.legend)}>
    <span {...stylex.attrs(styles.legendItem)}
      ><span {...stylex.attrs(styles.legendSwatchRed)}></span> Super effective (2×)</span
    >
    <span {...stylex.attrs(styles.legendItem)}
      ><span {...stylex.attrs(styles.legendSwatchGreen)}></span> Not very effective
      (½×)</span
    >
    <span {...stylex.attrs(styles.legendItem)}
      ><span {...stylex.attrs(styles.legendSwatchNone)}></span> No effect (0×)</span
    >
    <span {...stylex.attrs(styles.legendItem)}
      ><span {...stylex.attrs(styles.legendSwatchNeutral)}></span> Neutral (1×)</span
    >
    <span {...stylex.attrs(styles.legendNote)}
      >Single-type matchups cap at 2× / ½× — 4× / ¼× only happens against
      dual-type defenders.</span
    >
  </div>
</FitViewport>
