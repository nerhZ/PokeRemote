<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { base } from "$app/paths";
    import { onMount, untrack } from "svelte";
    import { getPokemonList, getPokemonCatalogMeta, getRandomPokemon, getAutocompleteList, getPokemonDetail } from "$lib/api";
    import { TYPE_COLORS, GEN_RANGES, ALL_TYPES, TOTAL_SPECIES, TOTAL_POKEMON, formLabel, formatName, getGeneration } from "$lib/pokemon-types";
    import { getFavorites, toggleFavorite, getRecent, type FavEntry } from "$lib/storage";
    import TypeBadge from "$lib/components/TypeBadge.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";

    let pokemon = $state<any[]>([]);
    let loading = $state(true);
    let loadingMore = $state(false);
    let error = $state<string | null>(null);
    let searchQuery = $state("");
    let activeTypes = $state<string[]>([]);
    let activeGens = $state<string[]>([]);
    let sortBy = $state("id-asc");
    let nextOffset = $state(0);
    let totalCount = $state(0);
    let pokemonTotal = $state(TOTAL_POKEMON);
    let filtersOpen = $state(false);
    let favorites = $state<FavEntry[]>([]);
    let recent = $state<ReturnType<typeof getRecent>>([]);
    let showFavoritesOnly = $state(false);
    let expandedId = $state<number | null>(null);
    let scrollFired = false;
    let allNames: { name: string; id: number }[] = $state([]);
    let searching = $state(false);

    $effect(() => {
        const p = page.url.pathname;
        if (p === `${base}/` || p === base || p === '/') {
            const sq = untrack(() => searchQuery);
            const at = untrack(() => activeTypes.length);
            const sf = untrack(() => showFavoritesOnly);
            if (sq || at > 0 || sf) {
                searchQuery = '';
                activeTypes = [];
                showFavoritesOnly = false;
                if (untrack(() => activeGens.length > 0)) { activeGens = []; loadRange(0, 40, false); }
            }
        }
    });

    async function loadRange(offset: number, limit: number, append = false) {
        const data = await getPokemonList({ limit, offset });
        pokemon = append ? [...pokemon, ...data.results] : data.results;
        nextOffset = data.next_offset;
        totalCount = data.count;
    }

    onMount(() => {
        favorites = getFavorites();
        recent = getRecent();
        getPokemonCatalogMeta({})
            .then((m) => { pokemonTotal = m.pokemon_count; })
            .catch(() => {});
        getAutocompleteList({})
            .then((c) => { allNames = c.results; })
            .catch(() => {});
        loadRange(0, 40, false)
            .catch((e: any) => { error = e.message; })
            .finally(() => { loading = false; });

        function onScroll() {
            if (loading || loadingMore || searching || nextOffset >= totalCount) return;
            const bottom = window.innerHeight + window.scrollY;
            const docH = document.documentElement.scrollHeight;
            if (docH - bottom < 600) {
                if (scrollFired) return;
                scrollFired = true;
                loadMore().finally(() => { scrollFired = false; });
            }
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    });

    async function loadMore(limit = 40) {
        if (loadingMore || searching) return;
        loadingMore = true;
        try {
            await loadRange(nextOffset, limit, true);
        } catch (e: any) {
            error = e.message;
        } finally {
            loadingMore = false;
        }
    }

    async function randomPokemon() {
        try {
            const r = await getRandomPokemon({});
            goto(`${base}/pokemon/${r.name}`);
        } catch {
            goto(`${base}/pokemon/${Math.floor(Math.random() * TOTAL_SPECIES) + 1}`);
        }
    }

    function toggleForms(e: MouseEvent, id: number) {
        e.preventDefault();
        e.stopPropagation();
        expandedId = expandedId === id ? null : id;
    }

    function onFav(e: MouseEvent, p: any) {
        e.preventDefault();
        e.stopPropagation();
        favorites = toggleFavorite({
            id: p.id,
            name: p.name,
            image: p.image,
            types: p.types,
        });
    }

    let searchResults = $state<any[]>([]);
    let searchLoading = $state(false);
    let searchGen = 0;

    async function runSearch(q: string) {
        const gen = ++searchGen;
        searching = true;
        searchLoading = true;
        const matches = allNames
            .filter((n) => n.name.toLowerCase().includes(q) || String(n.id).includes(q))
            .slice(0, 40);
        const results = await Promise.all(
            matches.map(async (n) => {
                const existing = pokemon.find((p) => p.name === n.name);
                if (existing) return existing;
                try {
                    const d = await getPokemonDetail(n.name);
                    return { name: d.name, id: d.id, image: d.sprites.other["official-artwork"].front_default, types: d.types, form_count: d.forms.length, forms: d.forms };
                } catch { return null; }
            })
        );
        if (gen !== searchGen) return;
        searchResults = results.filter(Boolean);
        searchLoading = false;
    }

    $effect(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q || allNames.length === 0) {
            searching = false;
            searchResults = [];
            return;
        }
        runSearch(q);
    });

    let filtered = $derived.by(() => {
        let result = showFavoritesOnly
            ? favorites.map((f) => ({
                  id: f.id,
                  name: f.name,
                  image: f.image,
                  types: f.types,
              }))
            : searching ? searchResults : pokemon;
        if (activeTypes.length > 0) result = result.filter((p) => p.types.some((t: string) => activeTypes.includes(t)));
        if (activeGens.length > 0) {
            result = result.filter((p) => activeGens.some((gl) => {
                const gen = GEN_RANGES.find((g) => g.label === gl);
                return gen && p.id >= gen.min && p.id <= gen.max;
            }));
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter((p) => p.name.toLowerCase().includes(q) || String(p.id).includes(q));
        }
        const sorted = [...result];
        if (sortBy === "id-asc") sorted.sort((a, b) => a.id - b.id);
        else if (sortBy === "id-desc") sorted.sort((a, b) => b.id - a.id);
        else if (sortBy === "name-asc") sorted.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortBy === "name-desc") sorted.sort((a, b) => b.name.localeCompare(a.name));
        return sorted;
    });

    $effect(() => {
        if (searching || loading || loadingMore) return;
        if (nextOffset >= totalCount) return;
        if (filtered.length < 20) loadMore(100);
    });
</script>

<div class="relative min-h-[calc(100vh-73px)]">
    <div class="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div class="absolute -top-24 -right-24 w-96 h-96 bg-pokemon-red/5 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl"></div>
    </div>

    <div class="max-w-7xl mx-auto px-4 md:px-6 relative">
        <div class="text-center pt-10 md:pt-14 pb-6">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold uppercase tracking-wider text-white/60 mb-5">
                <span class="w-2 h-2 rounded-full bg-pokemon-green animate-pulse"></span>
                {totalCount || TOTAL_SPECIES} species · {pokemonTotal} forms · {favorites.length} favorites
            </div>
            <h1 class="text-4xl md:text-6xl font-black mb-3 tracking-tight" style="color: var(--text)">
                Explore the
                <span class="bg-gradient-to-r from-pokemon-red via-pokemon-yellow to-accent bg-clip-text text-transparent">Pokémon World</span>
            </h1>
            <p class="text-base md:text-lg max-w-2xl mx-auto mb-5" style="color: var(--muted)">
                Filter by type & generation · tools for compare, teams & damage · press <kbd class="text-xs">R</kbd> for random
            </p>
            <div class="flex flex-wrap justify-center gap-2">
                <button onclick={randomPokemon} class="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition-all cursor-pointer">
                    Random Pokémon
                </button>
                <button onclick={() => (showFavoritesOnly = !showFavoritesOnly)} class="inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-semibold transition-all cursor-pointer {showFavoritesOnly ? 'bg-pokemon-yellow/20 border-pokemon-yellow/40 text-pokemon-yellow' : 'bg-white/5 border-white/10 text-white/70 hover:text-white'}">
                    ★ Favorites {favorites.length ? `(${favorites.length})` : ""}
                </button>
            </div>
        </div>

        {#if recent.length > 0 && !showFavoritesOnly}
            <div class="mb-6">
                <h2 class="text-xs font-bold uppercase tracking-wider text-white/40 mb-2">Recently viewed</h2>
                <div class="flex gap-2 overflow-x-auto pb-2">
                    {#each recent as r}
                        <a href="{base}/pokemon/{r.name}" class="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] no-underline hover:border-white/20 transition-all">
                            <img src={r.image} alt={r.name} class="w-8 h-8 object-contain" />
                            <span class="text-xs font-semibold text-white/70">{formatName(r.name)}</span>
                        </a>
                    {/each}
                </div>
            </div>
        {/if}

        <div class="sticky top-[57px] z-40 px-4 md:px-6 py-3 mb-6 backdrop-blur-md rounded-2xl border" style="background: color-mix(in srgb, var(--bg) 92%, transparent); border-color: var(--border)">
            <div class="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div class="relative flex-1 max-w-md">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input data-global-search type="search" placeholder="Search name or #..." bind:value={searchQuery} class="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:border-accent/50" />
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                    <button onclick={() => (filtersOpen = !filtersOpen)} class="md:hidden px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/70 cursor-pointer">
                        Filters {filtersOpen ? "▴" : "▾"}
                    </button>
                    <span class="text-xs text-white/40 hidden sm:inline">{filtered.length} results</span>
                    <select bind:value={sortBy} class="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white/70 text-xs outline-none cursor-pointer">
                        <option value="id-asc">ID ↑</option>
                        <option value="id-desc">ID ↓</option>
                        <option value="name-asc">Name A-Z</option>
                        <option value="name-desc">Name Z-A</option>
                    </select>
                </div>
                <p class="text-[10px] mt-1" style="color: var(--muted)">Click to toggle · select multiple to combine filters</p>
            </div>
            <div class="mt-3 space-y-2 {filtersOpen ? 'block' : 'hidden md:block'}">
                <div class="flex flex-wrap gap-1.5">
                    <button onclick={() => (activeTypes = [])} class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide cursor-pointer border {activeTypes.length === 0 ? 'bg-white text-bg-navy border-white' : 'bg-white/5 text-white/55 border-white/10'}">
                        All types{#if activeTypes.length > 0}<span class="ml-1 px-1.5 py-0.5 rounded-full text-[8px] bg-accent text-white">{activeTypes.length}</span>{/if}
                    </button>
                    {#each ALL_TYPES as t}
                        {@const sel = activeTypes.includes(t)}
                        <button
                            onclick={() => (activeTypes = sel ? activeTypes.filter((x) => x !== t) : [...activeTypes, t])}
                            class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide cursor-pointer border {sel ? 'text-white border-transparent' : 'bg-white/5 text-white/55 border-white/10'}"
                            style={sel ? `background-color: ${TYPE_COLORS[t]}` : ""}
                        >{t}</button>
                    {/each}
                </div>
                <div class="flex flex-wrap gap-1.5">
                    <button onclick={() => { activeGens = []; loadRange(0, 40, false); }} class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide cursor-pointer border {activeGens.length === 0 ? 'bg-accent text-white border-accent' : 'bg-white/5 text-white/55 border-white/10'}">
                        All gens{#if activeGens.length > 0}<span class="ml-1 px-1.5 py-0.5 rounded-full text-[8px] bg-white/20 text-white">{activeGens.length}</span>{/if}
                    </button>
                    {#each GEN_RANGES as gen}
                        {@const label = gen.label}
                        {@const sel = activeGens.includes(label)}
                        <button
                            onclick={() => {
                                if (sel) { activeGens = activeGens.filter((x) => x !== label); }
                                else { activeGens = [...activeGens, label]; }
                            }}
                            class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide cursor-pointer border {sel ? 'bg-accent text-white border-accent' : 'bg-white/5 text-white/55 border-white/10'}"
                        >{label.split(" ")[1].replace(/[()]/g, "")}</button>
                    {/each}
                </div>
            </div>
        </div>

        {#if loading}
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-16">
                {#each Array(15) as _}
                    <div class="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
                        <div class="aspect-square bg-white/[0.03] animate-pulse"></div>
                        <div class="p-4 space-y-2"><div class="h-3 w-16 bg-white/[0.06] rounded-full animate-pulse"></div><div class="h-5 w-24 bg-white/[0.06] rounded-full animate-pulse"></div></div>
                    </div>
                {/each}
            </div>
        {:else if error}
            <EmptyState title="Failed to load Pokémon" subtitle={error} actionLabel="Try again" onaction={() => window.location.reload()} />
        {:else if filtered.length === 0 && searchLoading}
            <div class="flex justify-center py-16">
                <div class="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>
        {:else if filtered.length === 0}
            <EmptyState title="No Pokémon found" subtitle="Try another filter, generation, or clear favorites mode" actionLabel="Reset filters" onaction={() => { searchQuery = ""; activeTypes = []; activeGens = []; showFavoritesOnly = false; loadRange(0, 40, false); }} />
        {:else}
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 pb-8">
                {#each filtered as p, i (p.id)}
                    {@const primaryColor = TYPE_COLORS[p.types?.[0]] || "#777"}
                    {@const fav = favorites.some((f) => f.id === p.id)}
                    {@const forms = p.forms || []}
                    {@const hasForms = (p.form_count ?? forms.length) > 1}
                    <div class="flex flex-col gap-1.5">
                        <a href="{base}/pokemon/{p.name}" class="poke-card card-enter group" style="animation-delay: {Math.min(i, 15) * 35}ms; view-transition-name: pokemon-{p.id}">
                            <div class="aspect-square relative flex items-center justify-center p-5 overflow-hidden">
                                <div class="absolute inset-0 opacity-40" style="background: radial-gradient(circle at 50% 70%, {primaryColor}22 0%, transparent 65%)"></div>
                                <img src={p.image} alt={p.name} loading="lazy" class="max-w-full max-h-full object-contain relative z-10 drop-shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1" />
                                <span class="absolute top-2.5 left-2.5 text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md bg-black/35 backdrop-blur-sm" style="color: {primaryColor}">#{String(p.id).padStart(3, "0")}</span>
                                <button
                                    onclick={(e) => onFav(e, p)}
                                    class="absolute top-2.5 right-2.5 w-8 h-8 rounded-lg bg-black/35 backdrop-blur-sm flex items-center justify-center text-sm cursor-pointer border-0 z-20 {fav ? 'text-pokemon-yellow' : 'text-white/40 hover:text-white'}"
                                    aria-label={fav ? "Remove favorite" : "Add favorite"}
                                >★</button>
                                {#if hasForms}
                                    <button
                                        onclick={(e) => toggleForms(e, p.id)}
                                        class="absolute bottom-2.5 right-2.5 z-20 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/40 backdrop-blur-sm border border-white/10 cursor-pointer text-white/80 hover:text-white"
                                    >{forms.length} forms {expandedId === p.id ? "▴" : "▾"}</button>
                                {/if}
                            </div>
                            <div class="p-3 pt-2 border-t border-white/[0.04]">
                                <h3 class="text-sm font-bold text-white/85 group-hover:text-white transition-colors">{formatName(p.name)}</h3>
                                <div class="flex flex-wrap items-center gap-1 mt-1.5">
                                    {#each p.types || [] as type}
                                        <TypeBadge {type} size="xs" />
                                    {/each}
                                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white/80 ml-auto" style="background: {primaryColor}33">{getGeneration(p.id).split(" ")[1].replace(/[()]/g, "")}</span>
                                </div>
                            </div>
                            <div class="type-edge" style="background: linear-gradient(90deg, {primaryColor}, {TYPE_COLORS[p.types?.[1]] || primaryColor})"></div>
                        </a>
                        {#if hasForms && expandedId === p.id}
                            <div class="rounded-xl border p-2 space-y-1" style="background: var(--surface); border-color: var(--border)">
                                {#each forms as form}
                                    <a
                                        href="{base}/pokemon/{form.name}"
                                        class="flex items-center gap-2 px-2 py-1.5 rounded-lg no-underline hover:bg-white/5 transition-colors"
                                        style="color: var(--text)"
                                    >
                                        <img src={form.image} alt={form.name} class="w-8 h-8 object-contain" loading="lazy" />
                                        <div class="min-w-0 flex-1">
                                            <div class="text-[11px] font-semibold truncate">{formLabel(form.name, p.name)}</div>
                                            <div class="text-[9px]" style="color: var(--muted)">#{form.id}{form.is_default ? " · default" : ""}</div>
                                        </div>
                                    </a>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
            {#if loadingMore}
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 pb-4">
                    {#each Array(10) as _}
                        <div class="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
                            <div class="aspect-square bg-white/[0.03] animate-pulse"></div>
                            <div class="p-4 space-y-2"><div class="h-3 w-16 bg-white/[0.06] rounded-full animate-pulse"></div><div class="h-5 w-24 bg-white/[0.06] rounded-full animate-pulse"></div></div>
                        </div>
                    {/each}
                </div>
            {/if}
            {#if activeTypes.length === 0 && activeGens.length === 0 && nextOffset < totalCount}
                <div class="flex justify-center pb-16">
                    {#if loadingMore}
                        <div class="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    {/if}
                </div>
            {/if}
        {/if}
    </div>
</div>
