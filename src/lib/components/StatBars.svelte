<script lang="ts">
  import { type PokemonDetail, STAT_LABELS } from "$lib/pokemon-types";
  let { pokemon, color = "#777" }: { pokemon: PokemonDetail; color?: string } =
    $props();
</script>

<div class="space-y-2.5">
  {#each pokemon.stats as stat}
    <div class="flex items-center gap-3">
      <span class="w-14 text-right text-[11px] font-bold text-white/50"
        >{STAT_LABELS[stat.name] || "?"}</span
      >
      <span class="w-8 text-right text-sm font-black" style="color: {color}"
        >{stat.base_stat}</span
      >
      <div class="h-2 flex-1 overflow-hidden rounded-full bg-white/6">
        <div
          class="h-full rounded-full"
          style="width: {(stat.base_stat / 255) *
            100}%; background: linear-gradient(90deg, {color}, {color}80)"
        ></div>
      </div>
    </div>
  {/each}
</div>
