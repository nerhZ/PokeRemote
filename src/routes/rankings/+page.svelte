<script lang="ts">
    import { getStatRankings } from "$lib/api";
    import { TYPE_COLORS, formatName, capitalize, TOTAL_POKEMON, type StatRankings } from "$lib/pokemon-types";
    import { base } from "$app/paths";
    import TypeBadge from "$lib/components/TypeBadge.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import { onMount } from "svelte";

    let rankings = $state<StatRankings | null>(null);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let activeStat = $state("total");

    const stats = [
        { key: "total", label: "Total", max: 720 },
        { key: "hp", label: "HP", max: 255 },
        { key: "attack", label: "Attack", max: 255 },
        { key: "defense", label: "Defense", max: 255 },
        { key: "special_attack", label: "Sp. Atk", max: 255 },
        { key: "special_defense", label: "Sp. Def", max: 255 },
        { key: "speed", label: "Speed", max: 255 },
    ];

    onMount(async () => {
        try {
            rankings = await getStatRankings({ count: TOTAL_POKEMON });
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    });

    let activeList = $derived(rankings ? rankings[activeStat as keyof StatRankings] ?? [] : []);
    let currentMax = $derived(stats.find((s) => s.key === activeStat)?.max ?? 255);

    function medalColor(i: number) {
        if (i === 0) return "#ffcb05";
        if (i === 1) return "#c0c0c0";
        if (i === 2) return "#cd7f32";
        return "var(--muted)";
    }
</script>

<div class="tool-shell max-w-3xl">
    <div class="tool-hero">
        <h1>Stat Rankings</h1>
        <p>Top 10 across all {TOTAL_POKEMON} forms. Click a row to open the Pokédex entry.</p>
    </div>

    <div class="flex flex-wrap gap-2 mb-6">
        {#each stats as s}
            <button
                onclick={() => (activeStat = s.key)}
                class="px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide cursor-pointer border {activeStat === s.key ? 'bg-accent text-white border-accent' : 'bg-white/5 text-white/50 border-white/10 hover:border-white/25'}"
            >{s.label}</button>
        {/each}
    </div>

    {#if loading}
        <div class="space-y-2">{#each Array(10) as _}<div class="h-16 bg-white/[0.03] rounded-2xl animate-pulse"></div>{/each}</div>
    {:else if error}
        <EmptyState title="Could not load rankings" subtitle={error} />
    {:else if activeList.length === 0}
        <EmptyState title="No data" subtitle="No rankings available for this stat." />
    {:else}
        <div class="space-y-2">
            {#each activeList as entry, i}
                <a href="{base}/pokemon/{entry.name}" class="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.05] transition-all no-underline group">
                    <span class="w-8 text-center text-lg font-black" style="color: {medalColor(i)}">#{i + 1}</span>
                    <img src={entry.image} alt={entry.name} class="w-12 h-12 object-contain group-hover:scale-110 transition-transform" />
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-bold text-white truncate">{formatName(entry.name)}</div>
                        <div class="flex items-center gap-1.5 mt-0.5">
                            <span class="text-[10px] text-white/30">#{String(entry.id).padStart(3, "0")}</span>
                            {#if entry.types}{#each entry.types as t}<TypeBadge type={t} size="xs" />{/each}{/if}
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-black text-white">{entry.value}</div>
                        <div class="w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden mt-1 ml-auto">
                            <div class="h-full rounded-full bg-accent" style="width: {(entry.value / currentMax) * 100}%"></div>
                        </div>
                    </div>
                </a>
            {/each}
        </div>
    {/if}
</div>
