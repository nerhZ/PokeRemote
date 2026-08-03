<script lang="ts">
  import { page } from "$app/state";
  import { resolve } from "$app/paths";
  import { onMount, untrack } from "svelte";
  import { getAllPokemonSummaries } from "$lib/api";
  import { gotoRandomPokemon } from "$lib/navigation";
  import { dismissAppLoader } from "$lib/loader";
  import { pageUrlSync } from "$lib/url-state";
  import {
    TYPE_COLORS,
    GEN_RANGES,
    ALL_TYPES,
    TOTAL_SPECIES,
    TOTAL_POKEMON,
    formLabel,
    formatName,
    formatId,
    getGeneration,
    generationShortLabel,
    tokenMatch,
    typeColor,
  } from "$lib/pokemon-types";
  import {
    getFavorites,
    toggleFavorite,
    getRecent,
    type FavEntry,
  } from "$lib/storage";
  import TypeBadge from "$lib/components/TypeBadge.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import Pokeball from "$lib/components/Pokeball.svelte";
  import PokemonImage from "$lib/components/PokemonImage.svelte";
  import FilterChip from "$lib/components/FilterChip.svelte";

  let allPokemon = $state<any[]>([]);
  let loadProgress = $state({ done: 0, total: 0 });
  let loadPhase = $state<"idle" | "loading" | "ready" | "error">("idle");
  let error = $state<string | undefined>(undefined);
  let searchQuery = $state("");
  let activeTypes = $state<string[]>([]);
  let activeGens = $state<string[]>([]);
  let sortBy = $state("id-asc");
  let filtersOpen = $state(false);
  let favorites = $state<FavEntry[]>([]);
  let recent = $state<ReturnType<typeof getRecent>>([]);
  let showFavoritesOnly = $state(false);
  let expandedId = $state<number | null>(null);

  const sync = pageUrlSync("/");

  onMount(() => {
    favorites = getFavorites();
    recent = getRecent();
    loadPhase = "loading";

    getAllPokemonSummaries((done, total) => {
      loadProgress = { done, total };
    })
      .then(({ data }) => {
        allPokemon = data;
        loadPhase = "ready";
        dismissAppLoader();
      })
      .catch((e: any) => {
        error = e.message || "Failed to load Pokémon";
        loadPhase = "error";
        dismissAppLoader();
      });
  });

  $effect(() => {
    const p = page.url.pathname;
    if (p === resolve("/") && !page.url.searchParams.get("type")) {
      const sq = untrack(() => searchQuery);
      const sf = untrack(() => showFavoritesOnly);
      if (sq || sf) {
        searchQuery = "";
        showFavoritesOnly = false;
      }
      if (untrack(() => activeGens.length > 0)) activeGens = [];
    }
  });

  let lastTypeParam = "";
  $effect(() => {
    const typeParam = page.url.searchParams.get("type") ?? "";
    if (typeParam === lastTypeParam) return;
    lastTypeParam = typeParam;
    activeTypes = typeParam
      ? typeParam.split(",").filter((t) => ALL_TYPES.includes(t))
      : [];
  });

  function setTypes(next: string[]) {
    activeTypes = next;
    lastTypeParam = next.join(",");
    const params = new URLSearchParams();
    if (next.length) params.set("type", next.join(","));
    else sync.clearPageState();
    sync.pushMerged(params, next.length ? [] : ["type"]);
  }

  function toggleType(t: string) {
    const sel = activeTypes.includes(t);
    setTypes(sel ? activeTypes.filter((x) => x !== t) : [...activeTypes, t]);
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

  function applyFilters(
    list: any[],
    opts: {
      types?: string[];
      gens?: string[];
      search?: string;
      favs?: boolean;
    },
  ): any[] {
    let result = list;
    if (opts.favs) {
      const favIds = new Set(favorites.map((f) => f.id));
      result = result.filter((p) => favIds.has(p.id));
    }
    if (opts.types && opts.types.length > 0) {
      result = result.filter((p) =>
        opts.types!.every((t) => p.types.includes(t)),
      );
    }
    if (opts.gens && opts.gens.length > 0) {
      result = result.filter((p) => opts.gens!.includes(p.gen));
    }
    if (opts.search) {
      result = result.filter((p) =>
        tokenMatch(
          opts.search!,
          p.name,
          p.id,
          (p.forms || []).map((f: any) => f.name),
        ),
      );
    }
    return result;
  }

  /** Types that can still produce results alongside the current filter combination. */
  let possibleTypes = $derived.by(() => {
    const avail = new Set<string>();
    for (const p of applyFilters(allPokemon, {
      types: activeTypes,
      gens: activeGens,
      search: searchQuery,
      favs: showFavoritesOnly,
    })) {
      for (const t of p.types ?? []) avail.add(t);
    }
    return avail;
  });

  /** Generations that can still produce results alongside the current filter combination. */
  let possibleGens = $derived.by(() => {
    const avail = new Set<string>();
    for (const p of applyFilters(allPokemon, {
      types: activeTypes,
      search: searchQuery,
      favs: showFavoritesOnly,
    })) {
      avail.add(p.gen);
    }
    return avail;
  });

  let filtered = $derived.by(() => {
    const result = applyFilters(allPokemon, {
      types: activeTypes,
      gens: activeGens,
      search: searchQuery,
      favs: showFavoritesOnly,
    });
    const sorted = [...result];
    if (sortBy === "id-asc") sorted.sort((a, b) => a.id - b.id);
    else if (sortBy === "id-desc") sorted.sort((a, b) => b.id - a.id);
    else if (sortBy === "name-asc")
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "name-desc")
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    return sorted;
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
        {allPokemon.length || TOTAL_SPECIES} species · {TOTAL_POKEMON} forms · {favorites.length}
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
          onclick={gotoRandomPokemon}
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
              <PokemonImage
                src={r.image}
                alt={r.name}
                class="h-8 w-8 object-contain"
              />
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
          <FilterChip
            label="All types"
            active={activeTypes.length === 0}
            variant="inverted"
            count={activeTypes.length > 0 ? activeTypes.length : undefined}
            onclick={() => setTypes([])}
          />
          {#each ALL_TYPES as t}
            <FilterChip
              label={t}
              active={activeTypes.includes(t)}
              variant="color"
              color={TYPE_COLORS[t]}
              disabled={loadPhase === "ready" &&
                !activeTypes.includes(t) &&
                !possibleTypes.has(t)}
              onclick={() => toggleType(t)}
            />
          {/each}
        </div>
        <div class="flex flex-wrap gap-1.5">
          <FilterChip
            label="All gens"
            active={activeGens.length === 0}
            count={activeGens.length > 0 ? activeGens.length : undefined}
            onclick={() => {
              activeGens = [];
            }}
          />
          {#each GEN_RANGES as gen}
            {@const label = gen.label}
            <FilterChip
              label={generationShortLabel(label)}
              active={activeGens.includes(label)}
              disabled={loadPhase === "ready" &&
                !activeGens.includes(label) &&
                !possibleGens.has(label)}
              onclick={() => {
                if (activeGens.includes(label)) {
                  activeGens = activeGens.filter((x) => x !== label);
                } else {
                  activeGens = [...activeGens, label];
                }
              }}
            />
          {/each}
        </div>
      </div>
    </div>

    {#if loadPhase === "loading"}
      <div class="flex flex-col items-center justify-center py-20">
        <Pokeball class="mb-8 h-24 w-24" spinning />
        {#if loadProgress.total > 0}
          <p class="text-sm font-semibold" style="color: var(--text)">
            Loading {loadProgress.done} / {loadProgress.total} species...
          </p>
          <div class="mt-4 h-1.5 w-64 overflow-hidden rounded-full bg-white/6">
            <div
              class="bg-accent h-full rounded-full transition-all duration-300"
              style="width: {(loadProgress.done / (loadProgress.total || 1)) *
                100}%"
            ></div>
          </div>
        {:else}
          <p class="text-sm" style="color: var(--muted)">Loading Pokédex...</p>
        {/if}
      </div>
    {:else if loadPhase === "error"}
      <EmptyState
        title="Failed to load Pokémon"
        subtitle={error}
        actionLabel="Try again"
        onaction={() => window.location.reload()}
      />
    {:else if filtered.length === 0}
      <EmptyState
        title="No Pokémon found"
        subtitle="Try another filter, generation, or clear favorites mode"
        actionLabel="Reset filters"
        onaction={() => {
          searchQuery = "";
          setTypes([]);
          activeGens = [];
          showFavoritesOnly = false;
        }}
      />
    {:else}
      <div
        class="grid grid-cols-2 gap-3 pb-8 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5"
      >
        {#each filtered as p, i (p.id)}
          {@const primaryColor = typeColor(p.types)}
          {@const fav = favorites.some((f) => f.id === p.id)}
          {@const forms = p.forms || []}
          {@const hasForms = (p.form_count ?? forms.length) > 1}
          <div class="flex flex-col gap-1.5">
            <a
              href={resolve(`/pokemon/${p.name}`)}
              class="poke-card card-enter group"
              style="animation-delay: {Math.min(i, 15) * 35}ms"
            >
              <div
                class="relative flex aspect-square items-center justify-center overflow-hidden p-5"
              >
                <div
                  class="absolute inset-0 opacity-40"
                  style="background: radial-gradient(circle at 50% 70%, {primaryColor}22 0%, transparent 65%)"
                ></div>
                <PokemonImage
                  src={p.image}
                  alt={p.name}
                  class="relative z-10 max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110"
                />
                <span
                  class="absolute top-2.5 left-2.5 rounded-md bg-black/35 px-2 py-0.5 text-[10px] font-black tracking-wider backdrop-blur-sm"
                  style="color: {primaryColor}">{formatId(p.id)}</span
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
                    >{generationShortLabel(getGeneration(p.id))}</span
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
                    <PokemonImage
                      src={form.image}
                      alt={form.name}
                      class="h-8 w-8 object-contain"
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
    {/if}
  </div>
</div>
