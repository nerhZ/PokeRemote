<script lang="ts">
  import * as stylex from "@stylexjs/stylex";
  import TypeBadgeInner from "./TypeBadgeInner.svelte";
  import { dynamic } from "../styles/dynamic.stylex";
  import { styles } from "./MatchupRow.styles";

  let {
    label,
    types,
    color,
  }: { label: string; types: string[]; color: string } = $props();
</script>

<div {...stylex.attrs(styles.row)}>
  <span {...stylex.attrs(styles.label, dynamic.color(color))}>{label}</span>
  <div {...stylex.attrs(styles.badges)}>
    {#each types as t}
      <TypeBadgeInner type={t} size="xs" />
    {/each}
  </div>
</div>
