<script lang="ts">
  import { type PokemonDetail, STAT_LABELS } from "$lib/pokemon-types";
  import * as stylex from "@stylexjs/stylex";
  import StatBar from "./StatBar.svelte";
  import { styles } from "./StatBars.styles";

  let { pokemon, color = "#777" }: { pokemon: PokemonDetail; color?: string } =
    $props();
</script>

<div {...stylex.attrs(styles.root)}>
  {#each pokemon.stats as stat}
    <StatBar
      label={STAT_LABELS[stat.name] || "?"}
      value={stat.base_stat}
      {color}
    />
  {/each}
</div>
