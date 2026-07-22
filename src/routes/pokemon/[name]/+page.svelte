<script lang="ts">
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { getPokemonDetail, getPokemonMoves, getSpeciesIds } from "$lib/api";
    import { TYPE_COLORS, TOTAL_SPECIES, formLabel, formatName, capitalize, type PokemonDetail, type PokemonMoves } from "$lib/pokemon-types";
    import { pushRecent, toggleFavorite, isFavorite } from "$lib/storage";
    import TypeBadge from "$lib/components/TypeBadge.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import RadarChart from "$lib/components/RadarChart.svelte";
    import StatBars from "$lib/components/StatBars.svelte";
    import TypeMatchup from "$lib/components/TypeMatchup.svelte";
    import EvolutionChain from "$lib/components/EvolutionChain.svelte";
    import TabBar from "$lib/components/TabBar.svelte";
    import { untrack } from "svelte";

    let pokemon = $state<PokemonDetail | null>(null);
    let moves = $state<PokemonMoves | null>(null);
    let loading = $state(true);
    let navigating = $state(false);
    let error = $state<string | null>(null);
    let isShiny = $state(false);
    let movesLoading = $state(false);
    let activeMoveTab = $state("level_up");
    let tab = $state<"overview" | "stats" | "matchups" | "moves" | "data">("overview");
    let fav = $state(false);
    let requestId = 0;
    let moveGen = 0;
    let speciesIds = $state<number[]>([]);

    $effect(() => {
        const name = page.params.name;
        if (!name) return;
        navigating = untrack(() => pokemon !== null);
        loading = untrack(() => pokemon === null);
        error = null;
        moves = null;
        isShiny = false;
        const id = ++requestId;
        getSpeciesIds().then((ids) => { speciesIds = ids; });
        getPokemonDetail(name)
            .then((p) => {
                if (id !== requestId) return;
                pokemon = p;
                navigating = false;
                if (p) {
                    fav = isFavorite(p.id);
                    pushRecent({
                        id: p.id,
                        name: p.name,
                        image: p.sprites.other["official-artwork"].front_default,
                    });
                    if (tab === "moves") loadMoves();
                }
            })
            .catch((e: any) => { if (id === requestId) { error = e.message; navigating = false; } })
            .finally(() => { if (id === requestId) loading = false; });
    });

    async function loadMoves() {
        if (moves || movesLoading) return;
        const name = page.params.name;
        if (!name) return;
        movesLoading = true;
        const gen = ++moveGen;
        try {
            const m = await getPokemonMoves(name);
            if (gen !== moveGen) return;
            if ((!m || m.level_up.length === 0) && pokemon && pokemon.name !== pokemon.species_name) {
                const fallback = await getPokemonMoves(pokemon.species_name);
                if (gen !== moveGen) return;
                moves = fallback;
            } else {
                moves = m;
            }
        } catch {}
        finally {
            if (gen === moveGen) movesLoading = false;
        }
    }

    const statLabels: Record<string, string> = {
        hp: "HP", attack: "ATK", defense: "DEF",
        "special-attack": "SP.ATK", "special-defense": "SP.DEF", speed: "SPD",
    };

    let prevId = $derived(speciesIds.length > 0 && pokemon ? (() => { const idx = speciesIds.indexOf(pokemon.species_id); return idx > 0 ? speciesIds[idx - 1] : null; })() : null);
    let nextId = $derived(speciesIds.length > 0 && pokemon ? (() => { const idx = speciesIds.indexOf(pokemon.species_id); return idx >= 0 && idx < speciesIds.length - 1 ? speciesIds[idx + 1] : null; })() : null);
    let primaryType = $derived(pokemon?.types[0] ?? "normal");
    let primaryColor = $derived(TYPE_COLORS[primaryType] || "#777");
    let statTotal = $derived(pokemon ? pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0) : 0);

    let spriteUrl = $derived(
        pokemon?.sprites.other["official-artwork"][isShiny ? "front_shiny" : "front_default"]
    );

    function onFav() {
        if (!pokemon) return;
        toggleFavorite({
            id: pokemon.id,
            name: pokemon.name,
            image: pokemon.sprites.other["official-artwork"].front_default,
            types: pokemon.types,
        });
        fav = !fav;
    }

    async function setTab(t: typeof tab) {
        tab = t;
        if (t === "moves") await loadMoves();
    }

    let genderInfo = $derived.by(() => {
        if (pokemon?.gender_rate === null || pokemon?.gender_rate === undefined) return null;
        if (pokemon.gender_rate === -1) return "Genderless";
        const female = (pokemon.gender_rate / 8) * 100;
        return `${100 - female}% ♂ / ${female}% ♀`;
    });

    let moveTabCounts = $derived({
        level_up: moves?.level_up?.length ?? 0,
        machine: moves?.machine?.length ?? 0,
        egg: moves?.egg?.length ?? 0,
        tutor: moves?.tutor?.length ?? 0,
    });

    const tabs = [
        { id: "overview" as const, label: "Overview" },
        { id: "stats" as const, label: "Stats" },
        { id: "matchups" as const, label: "Matchups" },
        { id: "moves" as const, label: "Moves" },
        { id: "data" as const, label: "Data" },
    ];
</script>

<div class="min-h-[calc(100vh-73px)] relative" style="background: linear-gradient(180deg, {primaryColor}18 0%, transparent 55%)">
    <div class="max-w-6xl mx-auto px-4 md:px-6 py-6 relative">
        <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
            <a href="/" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-white/60 hover:text-white transition-all no-underline">← Pokédex</a>
            {#if pokemon}
                <div class="flex items-center gap-2">
                    {#if prevId != null}
                        <a href="/pokemon/{prevId}" class="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white no-underline" aria-label="Previous species">‹</a>
                    {/if}
                    {#if nextId != null}
                        <a href="/pokemon/{nextId}" class="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white no-underline" aria-label="Next species">›</a>
                    {/if}
                </div>
            {/if}
        </div>

        {#if loading && !pokemon}
            <div class="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-8">
                <div class="aspect-square rounded-3xl bg-white/[0.03] animate-pulse"></div>
                <div class="space-y-4"><div class="h-64 bg-white/[0.03] rounded-3xl animate-pulse"></div><div class="h-40 bg-white/[0.03] rounded-3xl animate-pulse"></div></div>
            </div>
        {:else if error && !pokemon}
            <EmptyState title="Something went wrong" subtitle={error} actionLabel="Back to Pokédex" onaction={() => goto("/")} />
        {:else if pokemon}
            {#if navigating}
                <div class="absolute top-0 left-4 right-4 z-10 h-0.5 bg-white/[0.05] overflow-hidden">
                    <div class="h-full bg-accent/70" style="width: 33%; animation: nav-loading-bar 1.2s ease-in-out infinite"></div>
                </div>
            {/if}
            <div class="grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-8 items-start">
                <div class="lg:sticky lg:top-24">
                    <div class="relative rounded-3xl overflow-hidden border border-white/[0.06]" style="background: linear-gradient(180deg, {primaryColor}12 0%, transparent 70%)">
                        <div class="aspect-square flex items-center justify-center p-8 relative">
                            <div class="absolute w-56 h-56 rounded-full opacity-15" style="background: radial-gradient(circle, {primaryColor}, transparent 70%)"></div>
                            <img src={spriteUrl} alt={pokemon.name} class="w-full max-w-80 object-contain relative z-10 drop-shadow-2xl" style="animation: bob 3s ease-in-out infinite; view-transition-name: pokemon-{pokemon.id}" />
                        </div>
                        <div class="absolute top-4 left-4 flex gap-1.5 flex-wrap">
                            {#if pokemon.sprites.other["official-artwork"].front_shiny}
                                <button onclick={() => (isShiny = !isShiny)} class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase border cursor-pointer {isShiny ? 'bg-white text-bg-navy border-white' : 'bg-black/40 text-white/60 border-white/10'}">{isShiny ? "★ Shiny" : "☆ Shiny"}</button>
                            {/if}
                            {#if pokemon.cries}
                                <button onclick={() => { const a = new Audio(pokemon!.cries!); a.volume = 0.4; a.play(); }} class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-black/40 border border-white/10 text-white/60 cursor-pointer" aria-label="Play cry">🔊 Cry</button>
                            {/if}
                            <button onclick={onFav} class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase border cursor-pointer {fav ? 'bg-pokemon-yellow/20 border-pokemon-yellow/40 text-pokemon-yellow' : 'bg-black/40 border-white/10 text-white/60'}">{fav ? "★ Saved" : "☆ Save"}</button>
                        </div>
                        <div class="absolute top-4 right-4 flex flex-col gap-1.5">
                            {#if pokemon.is_legendary}<span class="px-3 py-1 rounded-full text-[10px] font-black uppercase text-white bg-gradient-to-r from-pokemon-yellow to-pokemon-gold">Legendary</span>{/if}
                            {#if pokemon.is_mythical}<span class="px-3 py-1 rounded-full text-[10px] font-black uppercase text-white bg-gradient-to-r from-pink-500 to-purple-500">Mythical</span>{/if}
                        </div>
                    </div>

                    <div class="text-center mt-5">
                        <span class="text-sm font-bold tracking-wider" style="color: {primaryColor}">#{String(pokemon.species_id).padStart(3, "0")}</span>
                        {#if pokemon.id !== pokemon.species_id}
                            <span class="text-xs ml-1.5" style="color: var(--muted)">form #{pokemon.id}</span>
                        {/if}
                        {#if pokemon.genus}<span class="text-sm ml-2" style="color: var(--muted)">{pokemon.genus}</span>{/if}
                        <h1 class="text-4xl md:text-5xl font-black mt-1" style="color: var(--text)">{formatName(pokemon.name)}</h1>
                        {#if pokemon.name !== pokemon.species_name}
                            <p class="text-xs mt-1" style="color: var(--muted)">{formLabel(pokemon.name, pokemon.species_name)} form of {formatName(pokemon.species_name)}</p>
                        {/if}
                        <div class="flex justify-center gap-2 mt-3">
                            {#each pokemon.types as type}<TypeBadge {type} size="md" />{/each}
                        </div>
                        {#if pokemon.flavor_text}
                            <p class="text-sm leading-relaxed mt-4 italic" style="color: var(--muted)">"{pokemon.flavor_text}"</p>
                        {/if}
                    </div>

                    <div class="grid grid-cols-2 gap-2 mt-5 panel !p-3">
                        <div class="text-center py-2"><div class="text-lg font-bold">{pokemon.height / 10}m</div><div class="text-[10px] uppercase tracking-wider text-white/40">Height</div></div>
                        <div class="text-center py-2 border-l border-white/[0.06]"><div class="text-lg font-bold">{pokemon.weight / 10}kg</div><div class="text-[10px] uppercase tracking-wider text-white/40">Weight</div></div>
                        <div class="text-center py-2 border-t border-white/[0.06]"><div class="text-lg font-bold">{pokemon.base_experience}</div><div class="text-[10px] uppercase tracking-wider text-white/40">Base Exp</div></div>
                        <div class="text-center py-2 border-t border-l border-white/[0.06]"><div class="text-lg font-bold">{pokemon.moves_count}</div><div class="text-[10px] uppercase tracking-wider text-white/40">Moves</div></div>
                    </div>

                    {#if pokemon.forms?.length > 1}
                        <div class="panel !p-3 mt-3 max-w-full overflow-hidden">
                            <h3 class="text-[10px] font-bold uppercase tracking-wider mb-2" style="color: var(--muted)">Forms ({pokemon.forms.length})</h3>
                            <div class="flex flex-wrap gap-2">
                                {#each pokemon.forms as form}
                                    <a
                                        href="/pokemon/{form.name}"
                                        class="flex flex-col items-center gap-1 w-16 p-1.5 rounded-xl border no-underline transition-all {form.name === pokemon.name ? 'border-accent bg-accent/10' : 'border-white/10 hover:border-white/25'}"
                                        style="color: var(--text)"
                                        title={form.name}
                                    >
                                        <img src={form.image} alt={form.name} class="w-12 h-12 object-contain" loading="lazy" />
                                        <span class="text-[9px] font-semibold text-center leading-tight line-clamp-2">{formLabel(form.name, pokemon.species_name)}</span>
                                    </a>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>

                <div class="pb-12">
                    <TabBar
                        tabs={tabs.map((t) => ({ id: t.id, label: t.label }))}
                        active={tab}
                        color={primaryColor}
                        onchange={(id) => setTab(id as typeof tab)}
                    />

                    {#if tab === "overview"}
                        <div class="space-y-5">
                            <div class="panel">
                                <h2 class="text-lg font-bold mb-4">Abilities</h2>
                                <div class="space-y-3">
                                    {#each pokemon.abilities as ability}
                                        <div class="p-3 rounded-xl border" style="background-color: {primaryColor}10; border-color: {primaryColor}25">
                                            <div class="flex items-center gap-2 mb-1">
                                                <span class="text-sm font-bold">{capitalize(ability.name.replace(/-/g, " "))}</span>
                                                {#if ability.is_hidden}<span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/50">Hidden</span>{/if}
                                            </div>
                                            {#if ability.description}<p class="text-xs text-white/50 leading-relaxed">{ability.description}</p>{/if}
                                        </div>
                                    {/each}
                                </div>
                            </div>

                            {#if pokemon.evolution?.children?.length}
                                <div class="panel">
                                    <h2 class="text-lg font-bold mb-4">Evolution Chain</h2>
                                    <EvolutionChain stage={pokemon.evolution} currentName={pokemon.name} color={primaryColor} />
                                </div>
                            {/if}

                            {#if pokemon.locations?.length}
                                <div class="panel">
                                    <h2 class="text-lg font-bold mb-4">Locations</h2>
                                    <div class="grid sm:grid-cols-2 gap-2">
                                        {#each pokemon.locations as loc}
                                            <div class="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs">
                                                <div class="font-semibold capitalize text-white/80">{loc.area}</div>
                                                <div class="text-white/40 capitalize mt-0.5">{loc.method}{loc.chance != null ? ` · ${loc.chance}%` : ""}</div>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {:else if tab === "stats"}
                        <div class="panel">
                            <div class="flex items-center justify-between mb-5">
                                <h2 class="text-lg font-bold">Base Stats</h2>
                                <div class="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black" style="background-color: {primaryColor}22; color: {primaryColor}">{statTotal}</div>
                            </div>
                            <div class="grid md:grid-cols-[200px_1fr] gap-6 items-center">
                                <RadarChart {pokemon} color={primaryColor} />
                                <StatBars {pokemon} color={primaryColor} />
                            </div>
                        </div>
                    {:else if tab === "matchups"}
                        <div class="panel">
                            <h2 class="text-lg font-bold mb-5">Type Effectiveness</h2>
                            <TypeMatchup effectiveness={pokemon.type_effectiveness} />
                        </div>
                    {:else if tab === "moves"}
                        <div class="panel">
                            <h2 class="text-lg font-bold mb-4">Moves</h2>
                            {#if movesLoading}
                                <div class="flex justify-center py-10"><div class="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div></div>
                            {:else if moves}
                                <div class="flex gap-2 mb-4 flex-wrap">
                                    {#each ["level_up", "machine", "egg", "tutor"] as t}
                                        {#if moveTabCounts[t as keyof typeof moveTabCounts] > 0}
                                            <button onclick={() => (activeMoveTab = t)} class="px-3 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer border-0 {activeMoveTab === t ? 'text-white' : 'bg-white/5 text-white/40'}" style={activeMoveTab === t ? `background-color: ${primaryColor}33` : ""}>
                                                {t === "level_up" ? "Level" : t === "machine" ? "TM" : t === "egg" ? "Egg" : "Tutor"} ({moveTabCounts[t as keyof typeof moveTabCounts]})
                                            </button>
                                        {/if}
                                    {/each}
                                </div>
                                {#if activeMoveTab === "level_up"}
                                    <div class="grid sm:grid-cols-2 gap-2 max-h-120 overflow-y-auto">
                                        {#each moves.level_up as m}
                                            <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-sm">
                                                <span class="w-8 text-[11px] font-black text-white/50 text-right">{m.level}</span>
                                                <TypeBadge type={m.type} size="xs" />
                                                <span class="flex-1 truncate font-semibold text-white/80">{capitalize(m.name.replace(/-/g, " "))}</span>
                                                <span class="text-[10px] text-white/30" title="Power / Accuracy / PP">{m.power ?? "—"}/{m.accuracy ?? "—"}/{m.pp ?? "—"}</span>
                                            </div>
                                        {/each}
                                    </div>
                                {:else}
                                    <div class="flex flex-wrap gap-2">
                                        {#each (moves as any)[activeMoveTab] as m}
                                            <span class="px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs capitalize text-white/70">{m.name.replace(/-/g, " ")}</span>
                                        {/each}
                                    </div>
                                {/if}
                            {/if}
                        </div>
                    {:else if tab === "data"}
                        <div class="panel">
                            <h2 class="text-lg font-bold mb-5">Pokédex Data</h2>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {#if pokemon.capture_rate != null}<div><div class="text-[10px] uppercase tracking-wider text-white/40">Catch Rate</div><div class="font-bold">{pokemon.capture_rate}/255</div></div>{/if}
                                {#if pokemon.base_happiness != null}<div><div class="text-[10px] uppercase tracking-wider text-white/40">Happiness</div><div class="font-bold">{pokemon.base_happiness}</div></div>{/if}
                                {#if pokemon.growth_rate}<div><div class="text-[10px] uppercase tracking-wider text-white/40">Growth</div><div class="font-bold capitalize">{pokemon.growth_rate.replace(/-/g, " ")}</div></div>{/if}
                                {#if pokemon.habitat}<div><div class="text-[10px] uppercase tracking-wider text-white/40">Habitat</div><div class="font-bold capitalize">{pokemon.habitat}</div></div>{/if}
                                {#if pokemon.color}<div><div class="text-[10px] uppercase tracking-wider text-white/40">Color</div><div class="font-bold capitalize">{pokemon.color}</div></div>{/if}
                                {#if pokemon.shape}<div><div class="text-[10px] uppercase tracking-wider text-white/40">Shape</div><div class="font-bold capitalize">{pokemon.shape}</div></div>{/if}
                                {#if pokemon.egg_groups.length}<div><div class="text-[10px] uppercase tracking-wider text-white/40">Egg Groups</div><div class="font-bold capitalize">{pokemon.egg_groups.map((g) => g.replace(/-/g, " ")).join(", ")}</div></div>{/if}
                                {#if genderInfo}<div><div class="text-[10px] uppercase tracking-wider text-white/40">Gender</div><div class="font-bold">{genderInfo}</div></div>{/if}
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div>
