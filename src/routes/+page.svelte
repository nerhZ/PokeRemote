<script lang="ts">
  import { page } from "$app/state";
  import { resolve } from "$app/paths";
  import { onMount, untrack } from "svelte";
  import { getAllPokemonSummaries } from "$lib/api";
  import { gotoRandomPokemon } from "$lib/navigation";
  import { pageUrlSync } from "$lib/url-state";
  import { spriteMode } from "$lib/sprite-mode.svelte";
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
  import LoadProgress from "$lib/components/LoadProgress.svelte";
  import PokemonImage from "$lib/components/PokemonImage.svelte";
  import FilterChip from "$lib/components/FilterChip.svelte";
  import Popover from "$lib/components/Popover.svelte";
  import { onCollapseFinished } from "$lib/search-anim";

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
  let special = $state<"legendary" | "mythical" | "">("");
  let expandedId = $state<number | null>(null);

  const sync = pageUrlSync("/");

  onMount(() => {
    favorites = getFavorites();
    recent = getRecent();
    loadPhase = "loading"; // show the spinner, not the empty state, while waiting

    // Kick the catalog fetch off immediately. The network is async, so it
    // costs the header's collapse animation nothing. Only the apply (parsing
    // the result and rendering the grid) is deferred until the collapse
    // finishes, since that synchronous chunk is what would freeze it.
    let started = false;
    const begin = () => {
      if (started) return;
      started = true;
      const load = getAllPokemonSummaries((done, total) => {
        loadProgress = { done, total };
      });
      let applied = false;
      const apply = () => {
        if (applied) return;
        applied = true;
        load
          .then(({ data }) => {
            allPokemon = data;
            loadPhase = "ready";
          })
          .catch((e: any) => {
            error = e.message || "Failed to load Pokémon";
            loadPhase = "error";
          });
      };

      const unsub = onCollapseFinished(apply);
      const fallback = setTimeout(apply, 2500); // safety net
      return () => {
        unsub();
        clearTimeout(fallback);
      };
    };

    return begin();
  });

  // Arrival-only reset: wipe in-page-only state (search, favorites mode) when
  // arriving at a bare home URL. `isHome` is a derived boolean so this effect
  // only re-runs when the pathname crosses the home boundary. `page.url` is
  // replaced on *every* navigation (including search-param-only changes), so
  // reading it directly here would wipe the search whenever the query params
  // change in-page (e.g. clearing a type chip).
  const isHome = $derived(page.url.pathname === resolve("/"));
  $effect(() => {
    if (!isHome) return;
    if (untrack(() => page.url.searchParams.get("type"))) return;
    if (untrack(() => page.url.searchParams.get("gen"))) return;
    if (untrack(() => page.url.searchParams.get("special"))) return;
    const sq = untrack(() => searchQuery);
    const sf = untrack(() => showFavoritesOnly);
    if (sq || sf) {
      searchQuery = "";
      showFavoritesOnly = false;
    }
    if (untrack(() => activeGens.length > 0)) activeGens = [];
    if (untrack(() => special)) special = "";
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

  let lastGenParam = "";
  $effect(() => {
    const genParam = page.url.searchParams.get("gen") ?? "";
    if (genParam === lastGenParam) return;
    lastGenParam = genParam;
    activeGens = genParam
      ? genParam
          .split(",")
          .map((g) =>
            GEN_RANGES.find((r) => generationShortLabel(r.label) === g),
          )
          .filter((r): r is (typeof GEN_RANGES)[number] => !!r)
          .map((r) => r.label)
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

  /** Sync the generation filters into the URL (short labels, e.g. `?gen=I,III`). */
  function setGens(next: string[]) {
    activeGens = next;
    lastGenParam = next.map(generationShortLabel).join(",");
    const params = new URLSearchParams();
    if (next.length)
      params.set("gen", next.map(generationShortLabel).join(","));
    else sync.clearPageState();
    sync.pushMerged(params, next.length ? [] : ["gen"]);
  }

  /** Sync the legendary/mythical filter into the URL (`?special=legendary`). */
  function setSpecial(next: "legendary" | "mythical" | "") {
    special = next;
    const params = new URLSearchParams();
    if (next) params.set("special", next);
    else sync.clearPageState();
    sync.pushMerged(params, next ? [] : ["special"]);
  }

  let lastSpecialParam = "";
  $effect(() => {
    const spParam = page.url.searchParams.get("special") ?? "";
    if (spParam === lastSpecialParam) return;
    lastSpecialParam = spParam;
    special = spParam === "legendary" || spParam === "mythical" ? spParam : "";
  });

  function toggleType(t: string) {
    const sel = activeTypes.includes(t);
    setTypes(sel ? activeTypes.filter((x) => x !== t) : [...activeTypes, t]);
  }

  function toggleForms(e: MouseEvent, id: number) {
    // The toggle sits inside the card link; don't navigate.
    e.preventDefault();
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
      special?: "legendary" | "mythical" | "";
    },
  ): any[] {
    const { types, gens, search, favs, special } = opts;
    let result = list;
    if (favs) {
      const favIds = new Set(favorites.map((f) => f.id));
      result = result.filter((p) => favIds.has(p.id));
    }
    if (special === "legendary") {
      result = result.filter((p) => p.is_legendary);
    } else if (special === "mythical") {
      result = result.filter((p) => p.is_mythical);
    }
    if (types && types.length > 0) {
      result = result.filter((p) => types.every((t) => p.types.includes(t)));
    }
    if (gens && gens.length > 0) {
      result = result.filter((p) => gens.includes(p.gen));
    }
    if (search) {
      result = result.filter((p) =>
        tokenMatch(
          search,
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
      special,
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
      special,
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
      special,
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
                id={r.id}
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
      class="sticky top-17 z-40 mb-6 rounded-2xl border px-4 py-3 backdrop-blur-md md:px-6"
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
            aria-label="Search Pokémon by name or number"
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
          <span class="text-xs text-white/40">{filtered.length} results</span>
          <select
            bind:value={sortBy}
            aria-label="Sort Pokémon"
            class="focus:border-accent/50 cursor-pointer rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-white/70 outline-none"
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
              setGens([]);
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
                setGens(
                  activeGens.includes(label)
                    ? activeGens.filter((x) => x !== label)
                    : [...activeGens, label],
                );
              }}
            />
          {/each}
        </div>
        <div class="flex flex-wrap gap-1.5">
          <FilterChip
            label="All"
            active={special === ""}
            count={special !== "" ? 1 : undefined}
            onclick={() => setSpecial("")}
          />
          <FilterChip
            label="Legendary"
            active={special === "legendary"}
            count={loadPhase === "ready"
              ? allPokemon.filter((p) => p.is_legendary).length
              : undefined}
            onclick={() =>
              setSpecial(special === "legendary" ? "" : "legendary")}
          />
          <FilterChip
            label="Mythical"
            active={special === "mythical"}
            count={loadPhase === "ready"
              ? allPokemon.filter((p) => p.is_mythical).length
              : undefined}
            onclick={() => setSpecial(special === "mythical" ? "" : "mythical")}
          />
        </div>
      </div>
    </div>

    {#if loadPhase === "loading"}
      <LoadProgress
        done={loadProgress.done}
        total={loadProgress.total}
        noun="species"
      >
        <p class="text-sm" style="color: var(--muted)">Loading Pokédex...</p>
      </LoadProgress>
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
          setGens([]);
          setSpecial("");
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
          <Popover
            open={hasForms && expandedId === p.id}
            onClose={() => (expandedId = null)}
            panelClass="right-0 max-h-64 rounded-xl p-1.5"
          >
            {#snippet trigger()}
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
                    id={p.id}
                    alt={p.name}
                    class="relative z-10 object-contain drop-shadow-2xl transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110 {spriteMode.active
                      ? 'h-full w-full'
                      : 'max-h-full max-w-full'}"
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
                      <TypeBadge {type} size="xs" focusable={false} />
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
            {/snippet}
            {#snippet panel()}
              {#each forms as form}
                <a
                  href={resolve(`/pokemon/${form.name}`)}
                  class="flex items-center gap-2 rounded-lg px-2 py-1.5 no-underline transition-colors hover:bg-white/5"
                  style="color: var(--text)"
                >
                  <PokemonImage
                    src={form.image}
                    id={form.id}
                    alt={form.name}
                    class="h-8 w-8 shrink-0 object-contain"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-[11px] font-semibold">
                      {formLabel(form.name, p.name)}
                    </div>
                    <div class="text-[9px]" style="color: var(--muted)">
                      {formatId(form.id)}{form.is_default ? " · default" : ""}
                    </div>
                  </div>
                </a>
              {/each}
            {/snippet}
          </Popover>
        {/each}
      </div>
    {/if}
  </div>
</div>
