<script lang="ts">
    import { type TypeMatchup } from "$lib/pokemon-types";
    import { TYPE_COLORS } from "$lib/pokemon-types";
    import TypeBadge from "$lib/components/TypeBadge.svelte";

    let { effectiveness }: { effectiveness: TypeMatchup } = $props();

    let rows = $derived.by(() => {
        const r: { label: string; mult: string; types: string[]; color: string }[] = [];
        if (effectiveness.four_x_weak.length) r.push({ label: "Takes 4× from", mult: "4×", types: effectiveness.four_x_weak, color: "#ff3e3e" });
        if (effectiveness.two_x_weak.length) r.push({ label: "Takes 2× from", mult: "2×", types: effectiveness.two_x_weak, color: "#ff6b3e" });
        if (effectiveness.half_resist.length) r.push({ label: "Resists ½× from", mult: "½×", types: effectiveness.half_resist, color: "#3e7bff" });
        if (effectiveness.quarter_resist.length) r.push({ label: "Resists ¼× from", mult: "¼×", types: effectiveness.quarter_resist, color: "#3884ff" });
        if (effectiveness.immune.length) r.push({ label: "Immune to", mult: "0×", types: effectiveness.immune, color: "#4ade80" });
        return r;
    });
</script>

{#if rows.length === 0}
    <p class="text-white/40 text-sm">No special matchups.</p>
{:else}
    <div class="space-y-4">
        {#each rows as row}
            <div>
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs font-black" style="color: {row.color}">{row.mult}</span>
                    <span class="text-xs text-white/40">{row.label}</span>
                </div>
                <div class="flex flex-wrap gap-1.5">
                    {#each row.types as t}<TypeBadge type={t} size="sm" />{/each}
                </div>
            </div>
        {/each}
    </div>
{/if}
