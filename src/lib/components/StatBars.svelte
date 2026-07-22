<script lang="ts">
    import { type PokemonDetail } from "$lib/pokemon-types";
    let { pokemon, color = "#777" }: { pokemon: PokemonDetail; color?: string } = $props();

    const labels: Record<string, string> = {
        hp: "HP", attack: "ATK", defense: "DEF",
        "special-attack": "SP.ATK", "special-defense": "SP.DEF", speed: "SPD",
    };
</script>

<div class="space-y-2.5">
    {#each pokemon.stats as stat}
        <div class="flex items-center gap-3">
            <span class="w-14 text-[11px] font-bold text-white/50 text-right">{labels[stat.name] || "?"}</span>
            <span class="w-8 text-sm font-black text-right" style="color: {color}">{stat.base_stat}</span>
            <div class="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div class="h-full rounded-full" style="width: {(stat.base_stat / 255) * 100}%; background: linear-gradient(90deg, {color}, {color}80)"></div>
            </div>
        </div>
    {/each}
</div>
