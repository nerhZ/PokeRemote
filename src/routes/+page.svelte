<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { resolve } from "$app/paths";
  import { onMount, untrack } from "svelte";
  import {
    getPokemonList,
    getPokemonCatalogMeta,
    getRandomPokemon,
    getAutocompleteList,
    getPokemonDetail,
    getPokemonByType,
    getPokemonCardById,
    getPokemonByGen,
  } from "$lib/api";
  import {
    TYPE_COLORS,
    GEN_RANGES,
    ALL_TYPES,
    TOTAL_SPECIES,
    TOTAL_POKEMON,
    formLabel,
    formatName,
    getGeneration,
  } from "$lib/pokemon-types";
  import {
    getFavorites,
    toggleFavorite,
    getRecent,
    type FavEntry,
  } from "$lib/storage";
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
  let typeFiltering = $state(false);
  let typeResults = $state<any[]>([]);
  let typeGen = 0;
  let genFiltering = $state(false);
  let genResults = $state<any[]>([]);
  let genGen = 0;

  async function loadByTypes(types: string[], gen: number) {
    typeFiltering = true;
    try {
      const perType = await Promise.all(types.map((t) => getPokemonByType(t)));
      if (gen !== typeGen) return;
      let combined = perType[0];
      for (let i = 1; i < perType.length; i++) {
        const ids = new Set(perType[i].map((p) => p.id));
        combined = combined.filter((p) => ids.has(p.id));
      }
      combined.sort((a, b) => a.id - b.id);
      if (gen !== typeGen) return;
      typeResults = [];
      const batchSize = 10;
      for (let i = 0; i < combined.length; i += batchSize) {
        if (gen !== typeGen) return;
        const batch = combined.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(async (n) => {
            const existing = pokemon.find((p) => p.id === n.id);
            if (existing) return existing;
            try {
              const card = await getPokemonCardById(n.id);
              if (!card) return null;
              return {
                name: card.name,
                id: n.id,
                image: card.image,
                types: card.types,
                form_count: 1,
                forms: [],
              };
            } catch {
              return null;
            }
          }),
        );
        typeResults = [...typeResults, ...results.filter(Boolean)];
      }
      const ids = new Set<number>();
      typeResults = typeResults.filter((p) => {
        if (ids.has(p.id)) return false;
        ids.add(p.id);
        return true;
      });
    } catch {
    } finally {
      if (gen === typeGen) typeFiltering = false;
    }
  }

  $effect(() => {
    const types = activeTypes;
    if (types.length === 0) {
      typeResults = [];
      ++typeGen;
      return;
    }
    loadByTypes(types, ++typeGen);
  });

  async function loadByGens(gens: string[], gen: number) {
    genFiltering = true;
    try {
      const perGen = await Promise.all(gens.map((g) => getPokemonByGen(g)));
      if (gen !== genGen) return;
      const seen = new Set<number>();
      const combined: { name: string; id: number }[] = [];
      for (const list of perGen) {
        for (const p of list) {
          if (!seen.has(p.id)) {
            seen.add(p.id);
            combined.push(p);
          }
        }
      }
      combined.sort((a, b) => a.id - b.id);
      if (gen !== genGen) return;
      genResults = [];
      const batchSize = 10;
      for (let i = 0; i < combined.length; i += batchSize) {
        if (gen !== genGen) return;
        const batch = combined.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(async (n) => {
            const existing = pokemon.find((p) => p.id === n.id);
            if (existing) return existing;
            try {
              const card = await getPokemonCardById(n.id);
              if (!card) return null;
              return {
                name: card.name,
                id: n.id,
                image: card.image,
                types: card.types,
                form_count: 1,
                forms: [],
              };
            } catch {
              return null;
            }
          }),
        );
        genResults = [...genResults, ...results.filter(Boolean)];
      }
      const ids = new Set<number>();
      genResults = genResults.filter((p) => {
        if (ids.has(p.id)) return false;
        ids.add(p.id);
        return true;
      });
    } catch {
    } finally {
      if (gen === genGen) genFiltering = false;
    }
  }

  $effect(() => {
    const gens = activeGens;
    if (gens.length === 0) {
      genResults = [];
      ++genGen;
      return;
    }
    loadByGens(gens, ++genGen);
  });

  $effect(() => {
    const p = page.url.pathname;
    if (p === resolve("/")) {
      const sq = untrack(() => searchQuery);
      const at = untrack(() => activeTypes.length);
      const sf = untrack(() => showFavoritesOnly);
      if (sq || at > 0 || sf) {
        searchQuery = "";
        activeTypes = [];
        showFavoritesOnly = false;
        if (untrack(() => activeGens.length > 0)) activeGens = [];
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
      .then((m) => {
        pokemonTotal = m.pokemon_count;
      })
      .catch(() => {});
    getAutocompleteList({})
      .then((c) => {
        allNames = c.results;
      })
      .catch(() => {});
    loadRange(0, 40, false)
      .catch((e: any) => {
        error = e.message;
      })
      .finally(() => {
        loading = false;
      });

    function onScroll() {
      if (
        loading ||
        loadingMore ||
        searching ||
        typeFiltering ||
        genFiltering ||
        activeTypes.length > 0 ||
        activeGens.length > 0 ||
        showFavoritesOnly ||
        nextOffset >= totalCount
      )
        return;
      const bottom = window.innerHeight + window.scrollY;
      const docH = document.documentElement.scrollHeight;
      if (docH - bottom < 600) {
        if (scrollFired) return;
        scrollFired = true;
        loadMore().finally(() => {
          scrollFired = false;
        });
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
      goto(resolve(`/pokemon/${r.name}`));
    } catch {
      goto(
        resolve(`/pokemon/${Math.floor(Math.random() * TOTAL_SPECIES) + 1}`),
      );
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
      .filter(
        (n) => n.name.toLowerCase().includes(q) || String(n.id).includes(q),
      )
      .slice(0, 40);
    const results = await Promise.all(
      matches.map(async (n) => {
        const existing = pokemon.find((p) => p.name === n.name);
        if (existing) return existing;
        try {
          const d = await getPokemonDetail(n.name);
          return {
            name: d.name,
            id: d.id,
            image: d.sprites.other["official-artwork"].front_default,
            types: d.types,
            form_count: d.forms.length,
            forms: d.forms,
          };
        } catch {
          return null;
        }
      }),
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
      : searching
        ? searchResults
        : activeTypes.length > 0
          ? typeResults
          : activeGens.length > 0
            ? genResults
            : pokemon;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || String(p.id).includes(q),
      );
    }
    const sorted = [...result];
    if (sortBy === "id-asc") sorted.sort((a, b) => a.id - b.id);
    else if (sortBy === "id-desc") sorted.sort((a, b) => b.id - a.id);
    else if (sortBy === "name-asc")
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "name-desc")
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    return sorted;
  });

  $effect(() => {
    if (
      searching ||
      typeFiltering ||
      genFiltering ||
      activeTypes.length > 0 ||
      activeGens.length > 0 ||
      showFavoritesOnly ||
      loading ||
      loadingMore
    )
      return;
    if (nextOffset >= totalCount) return;
    if (filtered.length < 20) loadMore(100);
  });
</script>

<div class="relative min-h-[calc(100vh-73px)]">
  <div
    class="pointer-events-none absolute inset-0 overflow-hidden"
    aria-hidden="true"
  >
    <div
      class="bg-pokemon-red/5 absolute -top-24 -right-24 h-96 w-96 rounded-full blur-3xl"
    ></div>
    <div
      class="bg-accent/5 absolute -bottom-32 -left-32 h-125 w-125 rounded-full blur-3xl"
    ></div>
  </div>

  <div class="relative mx-auto max-w-7xl px-4 md:px-6">
    <div class="pt-10 pb-6 text-center md:pt-14">
      <div
        class="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wider text-white/60 uppercase"
      >
        <span class="bg-pokemon-green h-2 w-2 animate-pulse rounded-full"
        ></span>
        {totalCount || TOTAL_SPECIES} species · {pokemonTotal} forms · {favorites.length}
        favorites
      </div>
      <h1
        class="mb-3 text-4xl font-black tracking-tight md:text-6xl"
        style="color: var(--text)"
      >
        Explore the
        <span
          class="from-pokemon-red via-pokemon-yellow to-accent bg-linear-to-r bg-clip-text text-transparent"
          >Pokémon World</span
        >
      </h1>
      <p
        class="mx-auto mb-5 max-w-2xl text-base md:text-lg"
        style="color: var(--muted)"
      >
        Filter by type & generation · tools for compare, teams & damage · press <kbd
          class="text-xs">R</kbd
        > for random
      </p>
      <div class="flex flex-wrap justify-center gap-2">
        <button
          onclick={randomPokemon}
          class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition-all hover:bg-white/10 hover:text-white"
        >
          Random Pokémon
        </button>
        <button
          onclick={() => (showFavoritesOnly = !showFavoritesOnly)}
          class="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all {showFavoritesOnly
            ? 'bg-pokemon-yellow/20 border-pokemon-yellow/40 text-pokemon-yellow'
            : 'border-white/10 bg-white/5 text-white/70 hover:text-white'}"
        >
          ★ Favorites {favorites.length ? `(${favorites.length})` : ""}
        </button>
      </div>
    </div>

    {#if recent.length > 0 && !showFavoritesOnly}
      <div class="mb-6">
        <h2
          class="mb-2 text-xs font-bold tracking-wider text-white/40 uppercase"
        >
          Recently viewed
        </h2>
        <div class="flex gap-2 overflow-x-auto pb-2">
          {#each recent as r}
            <a
              href={resolve(`/pokemon/${r.name}`)}
              class="flex shrink-0 items-center gap-2 rounded-xl border border-white/6 bg-white/3 px-3 py-2 no-underline transition-all hover:border-white/20"
            >
              <img src={r.image} alt={r.name} class="h-8 w-8 object-contain" />
              <span class="text-xs font-semibold text-white/70"
                >{formatName(r.name)}</span
              >
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <div
      class="sticky top-14.25 z-40 mb-6 rounded-2xl border px-4 py-3 backdrop-blur-md md:px-6"
      style="background: color-mix(in srgb, var(--bg) 92%, transparent); border-color: var(--border)"
    >
      <div
        class="flex flex-col items-stretch gap-3 md:flex-row md:items-center"
      >
        <div class="relative max-w-md flex-1">
          <div
            class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
          >
            <svg
              class="h-4 w-4 text-white/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              /></svg
            >
          </div>
          <input
            data-global-search
            type="search"
            placeholder="Search name or #..."
            bind:value={searchQuery}
            class="focus:border-accent/50 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-3 pl-10 text-sm text-white placeholder-white/30 outline-none"
          />
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            onclick={() => (filtersOpen = !filtersOpen)}
            class="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 md:hidden"
          >
            Filters {filtersOpen ? "▴" : "▾"}
          </button>
          <span class="hidden text-xs text-white/40 sm:inline"
            >{filtered.length} results</span
          >
          <select
            bind:value={sortBy}
            class="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-white/70 outline-none"
          >
            <option value="id-asc">ID ↑</option>
            <option value="id-desc">ID ↓</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>
        </div>
        <p class="mt-1 text-[10px]" style="color: var(--muted)">
          Click to toggle · types narrow by AND, gens broaden by OR
        </p>
      </div>
      <div class="mt-3 space-y-2 {filtersOpen ? 'block' : 'hidden md:block'}">
        <div class="flex flex-wrap gap-1.5">
          <button
            onclick={() => (activeTypes = [])}
            class="cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase {activeTypes.length ===
            0
              ? 'text-bg-navy border-white bg-white'
              : 'border-white/10 bg-white/5 text-white/55'}"
          >
            All types{#if activeTypes.length > 0}<span
                class="bg-accent ml-1 rounded-full px-1.5 py-0.5 text-[8px] text-white"
                >{activeTypes.length}</span
              >{/if}
          </button>
          {#each ALL_TYPES as t}
            {@const sel = activeTypes.includes(t)}
            <button
              onclick={() =>
                (activeTypes = sel
                  ? activeTypes.filter((x) => x !== t)
                  : [...activeTypes, t])}
              class="cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase {sel
                ? 'border-transparent text-white'
                : 'border-white/10 bg-white/5 text-white/55'}"
              style={sel ? `background-color: ${TYPE_COLORS[t]}` : ""}
              >{t}</button
            >
          {/each}
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            onclick={() => {
              activeGens = [];
            }}
            class="cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase {activeGens.length ===
            0
              ? 'bg-accent border-accent text-white'
              : 'border-white/10 bg-white/5 text-white/55'}"
          >
            All gens{#if activeGens.length > 0}<span
                class="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[8px] text-white"
                >{activeGens.length}</span
              >{/if}
          </button>
          {#each GEN_RANGES as gen}
            {@const label = gen.label}
            {@const sel = activeGens.includes(label)}
            <button
              onclick={() => {
                if (sel) {
                  activeGens = activeGens.filter((x) => x !== label);
                } else {
                  activeGens = [...activeGens, label];
                }
              }}
              class="cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase {sel
                ? 'bg-accent border-accent text-white'
                : 'border-white/10 bg-white/5 text-white/55'}"
              >{label.split(" ")[1].replace(/[()]/g, "")}</button
            >
          {/each}
        </div>
      </div>
    </div>

    {#if loading}
      <div
        class="grid grid-cols-2 gap-4 pb-16 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      >
        {#each Array(15) as _}
          <div
            class="overflow-hidden rounded-2xl border border-white/5 bg-white/3"
          >
            <div class="aspect-square animate-pulse bg-white/3"></div>
            <div class="space-y-2 p-4">
              <div class="h-3 w-16 animate-pulse rounded-full bg-white/6"></div>
              <div class="h-5 w-24 animate-pulse rounded-full bg-white/6"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if error}
      <EmptyState
        title="Failed to load Pokémon"
        subtitle={error}
        actionLabel="Try again"
        onaction={() => window.location.reload()}
      />
    {:else if filtered.length === 0 && (searchLoading || typeFiltering || genFiltering)}
      <div class="flex justify-center py-16">
        <div
          class="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"
        ></div>
      </div>
    {:else if filtered.length === 0}
      <EmptyState
        title="No Pokémon found"
        subtitle="Try another filter, generation, or clear favorites mode"
        actionLabel="Reset filters"
        onaction={() => {
          searchQuery = "";
          activeTypes = [];
          activeGens = [];
          showFavoritesOnly = false;
        }}
      />
    {:else}
      <div
        class="grid grid-cols-2 gap-3 pb-8 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5"
      >
        {#each filtered as p, i (p.id)}
          {@const primaryColor = TYPE_COLORS[p.types?.[0]] || "#777"}
          {@const fav = favorites.some((f) => f.id === p.id)}
          {@const forms = p.forms || []}
          {@const hasForms = (p.form_count ?? forms.length) > 1}
          <div class="flex flex-col gap-1.5">
            <a
              href={resolve(`/pokemon/${p.name}`)}
              class="poke-card card-enter group"
              style="animation-delay: {Math.min(i, 15) *
                35}ms; view-transition-name: pokemon-{p.id}"
            >
              <div
                class="relative flex aspect-square items-center justify-center overflow-hidden p-5"
              >
                <div
                  class="absolute inset-0 opacity-40"
                  style="background: radial-gradient(circle at 50% 70%, {primaryColor}22 0%, transparent 65%)"
                ></div>
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  class="relative z-10 max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110"
                />
                <span
                  class="absolute top-2.5 left-2.5 rounded-md bg-black/35 px-2 py-0.5 text-[10px] font-black tracking-wider backdrop-blur-sm"
                  style="color: {primaryColor}"
                  >#{String(p.id).padStart(3, "0")}</span
                >
                <button
                  onclick={(e) => onFav(e, p)}
                  class="absolute top-2.5 right-2.5 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-black/35 text-sm backdrop-blur-sm {fav
                    ? 'text-pokemon-yellow'
                    : 'text-white/40 hover:text-white'}"
                  aria-label={fav ? "Remove favorite" : "Add favorite"}
                  >★</button
                >
                {#if hasForms}
                  <button
                    onclick={(e) => toggleForms(e, p.id)}
                    class="absolute right-2.5 bottom-2.5 z-20 cursor-pointer rounded-md border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-bold text-white/80 backdrop-blur-sm hover:text-white"
                    >{forms.length} forms {expandedId === p.id
                      ? "▴"
                      : "▾"}</button
                  >
                {/if}
              </div>
              <div class="border-t border-white/4 p-3 pt-2">
                <h3
                  class="text-sm font-bold text-white/85 transition-colors group-hover:text-white"
                >
                  {formatName(p.name)}
                </h3>
                <div class="mt-1.5 flex flex-wrap items-center gap-1">
                  {#each p.types || [] as type}
                    <TypeBadge {type} size="xs" />
                  {/each}
                  <span
                    class="ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white/80"
                    style="background: {primaryColor}33"
                    >{getGeneration(p.id).split(" ")[1]?.replace(/[()]/g, "") ??
                      "?"}</span
                  >
                </div>
              </div>
              <div
                class="type-edge"
                style="background: linear-gradient(90deg, {primaryColor}, {TYPE_COLORS[
                  p.types?.[1]
                ] || primaryColor})"
              ></div>
            </a>
            {#if hasForms && expandedId === p.id}
              <div
                class="space-y-1 rounded-xl border p-2"
                style="background: var(--surface); border-color: var(--border)"
              >
                {#each forms as form}
                  <a
                    href={resolve(`/pokemon/${form.name}`)}
                    class="flex items-center gap-2 rounded-lg px-2 py-1.5 no-underline transition-colors hover:bg-white/5"
                    style="color: var(--text)"
                  >
                    <img
                      src={form.image}
                      alt={form.name}
                      class="h-8 w-8 object-contain"
                      loading="lazy"
                    />
                    <div class="min-w-0 flex-1">
                      <div class="truncate text-[11px] font-semibold">
                        {formLabel(form.name, p.name)}
                      </div>
                      <div class="text-[9px]" style="color: var(--muted)">
                        #{form.id}{form.is_default ? " · default" : ""}
                      </div>
                    </div>
                  </a>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
      {#if loadingMore}
        <div
          class="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5"
        >
          {#each Array(10) as _}
            <div
              class="overflow-hidden rounded-2xl border border-white/5 bg-white/3"
            >
              <div class="aspect-square animate-pulse bg-white/3"></div>
              <div class="space-y-2 p-4">
                <div
                  class="h-3 w-16 animate-pulse rounded-full bg-white/6"
                ></div>
                <div
                  class="h-5 w-24 animate-pulse rounded-full bg-white/6"
                ></div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
      {#if activeTypes.length === 0 && activeGens.length === 0 && nextOffset < totalCount}
        <div class="flex justify-center pb-16">
          {#if loadingMore && activeTypes.length === 0 && activeGens.length === 0 && !showFavoritesOnly}
            <div
              class="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white"
            ></div>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>
