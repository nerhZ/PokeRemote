<script lang="ts">
  import { type PokemonDetail, STAT_LABELS } from "$lib/pokemon-types";
  import StatBar from "./StatBar.svelte";

  let { pokemon, color = "#777" }: { pokemon: PokemonDetail; color?: string } =
    $props();
</script>

<div class="space-y-2.5">
  {#each pokemon.stats as stat}
    <StatBar
      label={STAT_LABELS[stat.name] || "?"}
      value={stat.base_stat}
      {color}
    />
  {/each}
</div>
