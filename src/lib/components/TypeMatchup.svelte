<script lang="ts">
  import { MATCHUP_COLORS, type TypeMatchup } from "$lib/pokemon-types";
  import * as stylex from "@stylexjs/stylex";
  import TypeBadge from "$lib/components/TypeBadge.svelte";
  import { dynamic } from "../styles/dynamic.stylex";
  import { styles } from "./TypeMatchup.styles";

  let { effectiveness }: { effectiveness: TypeMatchup } = $props();

  let rows = $derived.by(() => {
    const r: { label: string; mult: string; types: string[]; color: string }[] =
      [];
    if (effectiveness.four_x_weak.length)
      r.push({
        label: "Strong",
        mult: "4×",
        types: effectiveness.four_x_weak,
        color: MATCHUP_COLORS.strong,
      });
    if (effectiveness.two_x_weak.length)
      r.push({
        label: "Strong",
        mult: "2×",
        types: effectiveness.two_x_weak,
        color: MATCHUP_COLORS.strong,
      });
    if (effectiveness.half_resist.length)
      r.push({
        label: "Weak",
        mult: "½×",
        types: effectiveness.half_resist,
        color: MATCHUP_COLORS.weak,
      });
    if (effectiveness.quarter_resist.length)
      r.push({
        label: "Weak",
        mult: "¼×",
        types: effectiveness.quarter_resist,
        color: MATCHUP_COLORS.weak,
      });
    if (effectiveness.immune.length)
      r.push({
        label: "No effect",
        mult: "0×",
        types: effectiveness.immune,
        color: MATCHUP_COLORS.immune,
      });
    return r;
  });
</script>

{#if rows.length === 0}
  <p {...stylex.attrs(styles.empty)}>No special matchups.</p>
{:else}
  <div {...stylex.attrs(styles.rows)}>
    {#each rows as row}
      <div>
        <div {...stylex.attrs(styles.rowHead)}>
          <span {...stylex.attrs(styles.mult, dynamic.color(row.color))}
            >{row.mult}</span
          >
          <span {...stylex.attrs(styles.rowLabel)}>{row.label}</span>
        </div>
        <div {...stylex.attrs(styles.badges)}>
          {#each row.types as t}<TypeBadge type={t} size="sm" />{/each}
        </div>
      </div>
    {/each}
  </div>
{/if}
