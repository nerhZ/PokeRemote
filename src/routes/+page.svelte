<script lang="ts">
  import * as stylex from "@stylexjs/stylex";
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
    GEN_COLORS,
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
  import { shared } from "$lib/styles/shared.stylex";
  import TypeBadge from "$lib/components/TypeBadge.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import LoadProgress from "$lib/components/LoadProgress.svelte";
  import PokemonImage from "$lib/components/PokemonImage.svelte";
  import FilterChip from "$lib/components/FilterChip.svelte";
  import Popover from "$lib/components/Popover.svelte";
  import { onCollapseFinished } from "$lib/search-anim";
  import { dynamic } from "../lib/styles/dynamic.stylex";
  import { styles } from "./home.styles";

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

  /** Type chip counts for the other active filters: an active type counts
      within the current selection, an inactive one as if it were added. */
  let typeCounts = $derived.by(() => {
    const counts: Record<string, number> = {};
    if (loadPhase !== "ready") return counts;
    for (const t of ALL_TYPES) {
      counts[t] = applyFilters(allPokemon, {
        types: activeTypes.includes(t) ? activeTypes : [...activeTypes, t],
        gens: activeGens,
        search: searchQuery,
        favs: showFavoritesOnly,
        special,
      }).length;
    }
    return counts;
  });

  /** Generation chip counts, with the other filters applied. */
  let genCounts = $derived.by(() => {
    const counts: Record<string, number> = {};
    if (loadPhase !== "ready") return counts;
    for (const gen of GEN_RANGES) {
      counts[gen.label] = applyFilters(allPokemon, {
        types: activeTypes,
        gens: [gen.label],
        search: searchQuery,
        favs: showFavoritesOnly,
        special,
      }).length;
    }
    return counts;
  });

  /** Special chip counts, with the other filters applied. */
  let specialCounts = $derived.by(() => {
    const counts: Record<string, number> = {};
    if (loadPhase !== "ready") return counts;
    for (const s of ["legendary", "mythical"] as const) {
      counts[s] = applyFilters(allPokemon, {
        types: activeTypes,
        gens: activeGens,
        search: searchQuery,
        favs: showFavoritesOnly,
        special: s,
      }).length;
    }
    return counts;
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

  /** True when anything is narrowing the grid. */
  let canReset = $derived(
    searchQuery !== "" ||
      activeTypes.length > 0 ||
      activeGens.length > 0 ||
      special !== "" ||
      showFavoritesOnly,
  );

  /** Clear the search box, every chip filter, and favorites-only mode. */
  function resetFilters() {
    searchQuery = "";
    showFavoritesOnly = false;
    activeTypes = [];
    activeGens = [];
    special = "";
    lastTypeParam = "";
    lastGenParam = "";
    lastSpecialParam = "";
    sync.clearPageState();
    sync.push(new URLSearchParams());
  }
</script>

<div {...stylex.attrs(styles.root)}>
  <div {...stylex.attrs(styles.glowLayer)} aria-hidden="true">
    <div {...stylex.attrs(styles.glowRed)}></div>
    <div {...stylex.attrs(styles.glowAccent)}></div>
  </div>

  <div {...stylex.attrs(styles.container)}>
    <div {...stylex.attrs(styles.hero)}>
      <div {...stylex.attrs(styles.statsBadge)}>
        <span {...stylex.attrs(styles.pulseDot)}></span>
        {allPokemon.length || TOTAL_SPECIES} species · {TOTAL_POKEMON} forms · {favorites.length}
        favorites
      </div>
      <h1 {...stylex.attrs(styles.heroTitle)}>
        Explore the
        <span {...stylex.attrs(styles.heroGradient)}>Pokémon World</span>
      </h1>
      <p {...stylex.attrs(styles.heroText)}>
        Filter by type & generation · tools for compare, teams & damage · press <kbd
          {...stylex.attrs(shared.kbd, styles.heroKbd)}>R</kbd
        > for random
      </p>
      <div {...stylex.attrs(styles.heroActions)}>
        <button
          onclick={gotoRandomPokemon}
          {...stylex.attrs(styles.heroBtn, styles.heroBtnMuted)}
        >
          <svg
            {...stylex.attrs(styles.heroIcon)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path
              d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22"
            />
            <path d="m18 2 4 4-4 4" />
            <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
            <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
            <path d="m18 14 4 4-4 4" />
          </svg>
          Random Pokémon
        </button>
        <button
          onclick={() => (showFavoritesOnly = !showFavoritesOnly)}
          {...stylex.attrs(
            styles.heroBtn,
            showFavoritesOnly ? styles.heroBtnActive : styles.heroBtnOutline,
          )}
        >
          ★ Favorites {favorites.length ? `(${favorites.length})` : ""}
        </button>
      </div>
    </div>

    {#if recent.length > 0 && !showFavoritesOnly}
      <div {...stylex.attrs(styles.recentSection)}>
        <h2 {...stylex.attrs(styles.recentTitle)}>Recently viewed</h2>
        <div {...stylex.attrs(styles.recentRow)}>
          {#each recent as r}
            <a
              href={resolve(`/pokemon/${r.name}`)}
              {...stylex.attrs(styles.recentCard)}
            >
              <PokemonImage
                src={r.image}
                id={r.id}
                alt={r.name}
                sx={styles.recentImage}
              />
              <span {...stylex.attrs(styles.recentName)}
                >{formatName(r.name)}</span
              >
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <div {...stylex.attrs(styles.filterBar)}>
      <div {...stylex.attrs(styles.filterInner)}>
        <div {...stylex.attrs(styles.searchWrap)}>
          <div {...stylex.attrs(styles.searchIconWrap)}>
            <svg
              {...stylex.attrs(styles.searchIcon)}
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
            {...stylex.attrs(styles.searchInput)}
          />
        </div>
        <div {...stylex.attrs(styles.filterControls)}>
          <button
            onclick={() => (filtersOpen = !filtersOpen)}
            {...stylex.attrs(styles.filtersToggle)}
          >
            Filters {filtersOpen ? "▴" : "▾"}
          </button>
          <span {...stylex.attrs(styles.resultCount)}
            >{filtered.length} results</span
          >
          <select
            bind:value={sortBy}
            aria-label="Sort Pokémon"
            {...stylex.attrs(styles.sortSelect)}
          >
            <option value="id-asc">ID ↑</option>
            <option value="id-desc">ID ↓</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>
        </div>
        <p {...stylex.attrs(styles.filterHint)}>
          Click to toggle · types narrow by AND, gens broaden by OR
        </p>
        <button
          onclick={resetFilters}
          disabled={!canReset}
          {...stylex.attrs(
            styles.resetFilters,
            canReset ? styles.resetFiltersEnabled : styles.resetFiltersDisabled,
          )}
        >
          Reset filters
        </button>
      </div>
      <div
        {...stylex.attrs(
          styles.filterRows,
          !filtersOpen && styles.filterRowsCollapsed,
        )}
      >
        <div {...stylex.attrs(styles.chipRow)}>
          <FilterChip
            label="All types"
            active={activeTypes.length === 0}
            variant="inverted"
            onclick={() => setTypes([])}
          />
          {#each ALL_TYPES as t}
            <FilterChip
              label={t}
              active={activeTypes.includes(t)}
              variant="color"
              color={TYPE_COLORS[t]}
              count={typeCounts[t]}
              disabled={loadPhase === "ready" &&
                !activeTypes.includes(t) &&
                !possibleTypes.has(t)}
              onclick={() => toggleType(t)}
            />
          {/each}
        </div>
        <div {...stylex.attrs(styles.chipRow)}>
          <FilterChip
            label="All gens"
            active={activeGens.length === 0}
            variant="inverted"
            onclick={() => {
              setGens([]);
            }}
          />
          {#each GEN_RANGES as gen}
            {@const label = gen.label}
            <FilterChip
              label={generationShortLabel(label)}
              active={activeGens.includes(label)}
              variant="color"
              color={GEN_COLORS[generationShortLabel(label)]}
              count={genCounts[label]}
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
        <div {...stylex.attrs(styles.chipRow)}>
          <FilterChip
            label="All"
            active={special === ""}
            variant="inverted"
            onclick={() => setSpecial("")}
          />
          <FilterChip
            label="Legendary"
            active={special === "legendary"}
            variant="legendary"
            count={specialCounts["legendary"]}
            disabled={loadPhase === "ready" &&
              (specialCounts["legendary"] ?? 0) === 0}
            onclick={() =>
              setSpecial(special === "legendary" ? "" : "legendary")}
          />
          <FilterChip
            label="Mythical"
            active={special === "mythical"}
            variant="mythical"
            count={specialCounts["mythical"]}
            disabled={loadPhase === "ready" &&
              (specialCounts["mythical"] ?? 0) === 0}
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
        <p {...stylex.attrs(styles.loadingText)}>Loading Pokédex...</p>
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
      <div {...stylex.attrs(styles.grid)}>
        {#each filtered as p, i (p.id)}
          {@const primaryColor = typeColor(p.types)}
          {@const fav = favorites.some((f) => f.id === p.id)}
          {@const forms = p.forms || []}
          {@const hasForms = (p.form_count ?? forms.length) > 1}
          <Popover
            open={hasForms && expandedId === p.id}
            onClose={() => (expandedId = null)}
            panelSx={styles.formsPanel}
          >
            {#snippet trigger()}
              <a
                href={resolve(`/pokemon/${p.name}`)}
                {...stylex.attrs(
                  shared.pokeCard,
                  shared.cardEnter,
                  stylex.defaultMarker(),
                  dynamic.animationDelay(`${Math.min(i, 15) * 35}ms`),
                )}
              >
                <div {...stylex.attrs(styles.cardImageWrap)}>
                  <div
                    {...stylex.attrs(
                      styles.cardGlow,
                      dynamic.background(
                        `radial-gradient(circle at 50% 70%, ${primaryColor}22 0%, transparent 65%)`,
                      ),
                    )}
                  ></div>
                  <PokemonImage
                    src={p.image}
                    id={p.id}
                    alt={p.name}
                    sx={[
                      styles.cardImage,
                      spriteMode.active
                        ? styles.cardImageActive
                        : styles.cardImageFit,
                    ]}
                  />
                  <span
                    {...stylex.attrs(
                      styles.idBadge,
                      dynamic.color(primaryColor),
                    )}>{formatId(p.id)}</span
                  >
                  <button
                    onclick={(e) => onFav(e, p)}
                    {...stylex.attrs(
                      styles.favBtn,
                      fav ? styles.favActive : styles.favIdle,
                    )}
                    aria-label={fav ? "Remove favorite" : "Add favorite"}
                    >★</button
                  >
                  {#if hasForms}
                    <button
                      onclick={(e) => toggleForms(e, p.id)}
                      {...stylex.attrs(styles.formsBtn)}
                      >{forms.length} forms {expandedId === p.id
                        ? "▴"
                        : "▾"}</button
                    >
                  {/if}
                </div>
                <div {...stylex.attrs(styles.cardBody)}>
                  <h3 {...stylex.attrs(styles.cardName)}>
                    {formatName(p.name)}
                  </h3>
                  <div {...stylex.attrs(styles.typeRow)}>
                    {#each p.types || [] as type}
                      <TypeBadge
                        {type}
                        size="xs"
                        focusable={false}
                        link={false}
                      />
                    {/each}
                    <span
                      {...stylex.attrs(
                        shared.grow,
                        styles.genBadge,
                        dynamic.background(`${primaryColor}33`),
                      )}>{generationShortLabel(getGeneration(p.id))}</span
                    >
                  </div>
                </div>
                <div
                  {...stylex.attrs(
                    shared.typeEdge,
                    dynamic.background(
                      `linear-gradient(90deg, ${primaryColor}, ${TYPE_COLORS[p.types?.[1]] || primaryColor})`,
                    ),
                  )}
                ></div>
              </a>
            {/snippet}
            {#snippet panel()}
              {#each forms as form}
                <a
                  href={resolve(`/pokemon/${form.name}`)}
                  {...stylex.attrs(styles.formLink)}
                >
                  <PokemonImage
                    src={form.image}
                    id={form.id}
                    alt={form.name}
                    sx={styles.formImage}
                  />
                  <div {...stylex.attrs(styles.formBody)}>
                    <div {...stylex.attrs(styles.formName)}>
                      {formLabel(form.name, p.name)}
                    </div>
                    <div {...stylex.attrs(styles.formMeta)}>
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
