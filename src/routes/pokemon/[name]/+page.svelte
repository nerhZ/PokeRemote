<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { getPokemonDetail, getPokemonMoves, getSpeciesIds } from "$lib/api";
  import {
    TYPE_COLORS,
    REGIONAL_DEX_LABELS,
    formLabel,
    formatName,
    formatId,
    STAT_LABELS,
    statTotal,
    type PokemonDetail,
    type PokemonMoves,
  } from "$lib/pokemon-types";
  import {
    pushRecent,
    toggleFavorite,
    isFavorite,
    getSavedTeams,
  } from "$lib/storage";
  import { backTarget } from "$lib/navigation";
  import { pageLoading } from "$lib/loading-state.svelte";
  import { flash } from "$lib/utils";
  import TypeBadge from "$lib/components/TypeBadge.svelte";
  import PokemonImage from "$lib/components/PokemonImage.svelte";
  import MoveTooltip from "$lib/components/MoveTooltip.svelte";
  import Pokeball from "$lib/components/Pokeball.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import RadarChart from "$lib/components/RadarChart.svelte";
  import StatBars from "$lib/components/StatBars.svelte";
  import TypeMatchup from "$lib/components/TypeMatchup.svelte";
  import EvolutionChain from "$lib/components/EvolutionChain.svelte";
  import TabBar from "$lib/components/TabBar.svelte";
  import { untrack } from "svelte";
  import * as stylex from "@stylexjs/stylex";
  import { shared } from "$lib/styles/shared.stylex";
  import { dynamic } from "../../../lib/styles/dynamic.stylex";
  import { styles } from "./styles";

  let pokemon = $state<PokemonDetail | null>(null);
  let moves = $state<PokemonMoves | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let isShiny = $state(false);
  let movesLoading = $state(false);
  let activeMoveTab = $state("level_up");
  let tab = $state<"overview" | "stats" | "matchups" | "moves" | "data">(
    "overview",
  );
  let fav = $state(false);
  let requestId = 0;
  let moveGen = 0;
  let speciesIds = $state<number[]>([]);
  /** Raw URL key whose content is currently displayed. The URL may use ids or
      names (PokeAPI normalizes `/pokemon/26` → raticate), so identity can't be
      compared to `pokemon.name`; the requested key itself is tracked. */
  let loadedName = "";

  $effect(() => {
    const name = page.params.name;
    if (!name) return;
    if (untrack(() => loadedName) !== name) {
      // The URL now points at a different entry: drop the previous Pokémon so
      // the skeleton shows instead of stale content (and stale prev/next
      // arrows). `pokemon` is only read untracked here, so this write does
      // not re-trigger the effect.
      pokemon = null;
      loadedName = name;
    }
    loading = untrack(() => pokemon === null);
    error = null;
    moves = null;
    movesLoading = false;
    moveGen++;
    back = backTarget(localStorage.getItem("previousUrl"));
    isShiny = false;
    pageLoading.active = true;
    const id = ++requestId;
    getSpeciesIds()
      .then((ids) => {
        speciesIds = ids;
      })
      // Prev/next are optional chrome; a failure (e.g. offline) must not
      // surface as an unhandled rejection.
      .catch(() => {});
    getPokemonDetail(name)
      .then((p) => {
        if (id !== requestId) return;
        pokemon = p;
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
      .catch((e: any) => {
        if (id === requestId) {
          error = e.message;
        }
      })
      .finally(() => {
        if (id === requestId) {
          loading = false;
          pageLoading.active = false;
        }
      });
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
      if (
        (!m || m.level_up.length === 0) &&
        pokemon &&
        pokemon.name !== pokemon.species_name
      ) {
        const fallback = await getPokemonMoves(pokemon.species_name);
        if (gen !== moveGen) return;
        moves = fallback;
      } else {
        moves = m;
      }
    } catch {
    } finally {
      if (gen === moveGen) movesLoading = false;
    }
  }

  /** Neighboring species id in national-dex order (wraps at both ends). */
  function siblingSpeciesId(offset: number): number | null {
    if (!pokemon || speciesIds.length === 0) return null;
    const idx = speciesIds.indexOf(pokemon.species_id);
    if (idx < 0) return null;
    return speciesIds[(idx + offset + speciesIds.length) % speciesIds.length];
  }
  let prevId = $derived(siblingSpeciesId(-1));
  let nextId = $derived(siblingSpeciesId(1));
  let primaryType = $derived(pokemon?.types[0] ?? "normal");
  let primaryColor = $derived(TYPE_COLORS[primaryType] || "#777");
  let totalStats = $derived(pokemon ? statTotal(pokemon.stats) : 0);

  let heroArtwork = $derived(
    pokemon?.sprites.other["official-artwork"][
      isShiny ? "front_shiny" : "front_default"
    ] ??
      pokemon?.sprites.other["official-artwork"].front_default ??
      "",
  );

  let teamParam = $derived.by(() => {
    if (!pokemon) return "";
    const p = pokemon;
    return [
      ...(getSavedTeams()[0]?.names ?? []).filter((n) => n !== p.name),
      p.name,
    ]
      .slice(-6)
      .join(",");
  });

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

  let linkCopied = $state(false);
  async function copyLink() {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      flash((v) => (linkCopied = v));
    } catch {}
  }

  async function setTab(t: typeof tab) {
    tab = t;
    if (t === "moves") await loadMoves();
  }

  let genderInfo = $derived.by(() => {
    if (pokemon?.gender_rate === null || pokemon?.gender_rate === undefined)
      return null;
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

  const MOVE_TAB_LABELS: Record<string, string> = {
    level_up: "Level",
    machine: "TM",
    egg: "Egg",
    tutor: "Tutor",
  };

  /** Height / weight / base exp / moves cells of the hero panel. */
  let quickStats = $derived(
    pokemon
      ? [
          { value: `${pokemon.height / 10}m`, label: "Height" },
          { value: `${pokemon.weight / 10}kg`, label: "Weight" },
          { value: String(pokemon.base_experience), label: "Base Exp" },
          { value: String(pokemon.moves_count), label: "Moves" },
        ]
      : [],
  );

  /** Pokédex data tab entries; only non-null fields render. */
  let dexData = $derived.by(() => {
    if (!pokemon) return [];
    const entries: { label: string; value: string; capitalize?: boolean }[] =
      [];
    if (pokemon.capture_rate != null)
      entries.push({
        label: "Catch Rate",
        value: `${pokemon.capture_rate}/255`,
      });
    if (pokemon.base_happiness != null)
      entries.push({
        label: "Happiness",
        value: String(pokemon.base_happiness),
      });
    if (pokemon.growth_rate)
      entries.push({
        label: "Growth",
        value: pokemon.growth_rate.replace(/-/g, " "),
        capitalize: true,
      });
    if (pokemon.habitat)
      entries.push({
        label: "Habitat",
        value: pokemon.habitat,
        capitalize: true,
      });
    if (pokemon.color)
      entries.push({ label: "Color", value: pokemon.color, capitalize: true });
    if (pokemon.shape)
      entries.push({ label: "Shape", value: pokemon.shape, capitalize: true });
    if (pokemon.egg_groups.length)
      entries.push({
        label: "Egg Groups",
        value: pokemon.egg_groups.map((g) => g.replace(/-/g, " ")).join(", "),
        capitalize: true,
      });
    if (genderInfo) entries.push({ label: "Gender", value: genderInfo });
    return entries;
  });

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "stats" as const, label: "Stats" },
    { id: "matchups" as const, label: "Matchups" },
    { id: "moves" as const, label: "Moves" },
    { id: "data" as const, label: "Data" },
  ];

  let back = $state<{ url: string; label: string }>({
    url: resolve("/"),
    label: "Pokédex",
  });
</script>

<div
  {...stylex.attrs(
    styles.pageRoot,
    dynamic.background(
      `linear-gradient(180deg, ${primaryColor}18 0%, transparent 55%)`,
    ),
  )}
>
  <div {...stylex.attrs(styles.container)}>
    <div {...stylex.attrs(styles.topBar)}>
      <a href={back.url} {...stylex.attrs(styles.backLink)}>← {back.label}</a>
      {#if pokemon}
        <div {...stylex.attrs(styles.navButtons)}>
          {#if prevId != null}
            <a
              href={resolve(`/pokemon/${prevId}`)}
              {...stylex.attrs(styles.siblingLink)}
              aria-label="Previous species">‹</a
            >
          {/if}
          {#if nextId != null}
            <a
              href={resolve(`/pokemon/${nextId}`)}
              {...stylex.attrs(styles.siblingLink)}
              aria-label="Next species">›</a
            >
          {/if}
        </div>
      {/if}
    </div>

    {#if loading && !pokemon}
      <div {...stylex.attrs(styles.heroGrid)}>
        <div {...stylex.attrs(styles.skeletonHero, styles.pulse)}></div>
        <div {...stylex.attrs(styles.skeletonSide)}>
          <div {...stylex.attrs(styles.skeletonTall, styles.pulse)}></div>
          <div {...stylex.attrs(styles.skeletonShort, styles.pulse)}></div>
        </div>
      </div>
    {:else if error && !pokemon}
      <EmptyState
        title="Something went wrong"
        subtitle={error}
        actionLabel="Back to Pokédex"
        onaction={() => goto(resolve("/"))}
      />
    {:else if pokemon}
      <div {...stylex.attrs(styles.mainGrid)}>
        <div {...stylex.attrs(styles.stickyCol)}>
          <div
            {...stylex.attrs(
              styles.artCard,
              dynamic.background(
                `linear-gradient(180deg, ${primaryColor}12 0%, transparent 70%)`,
              ),
            )}
          >
            <div {...stylex.attrs(styles.artStage)}>
              <div
                {...stylex.attrs(
                  styles.artGlow,
                  dynamic.background(
                    `radial-gradient(circle, ${primaryColor}, transparent 70%)`,
                  ),
                )}
              ></div>
              <PokemonImage
                src={heroArtwork}
                id={isShiny ? undefined : pokemon.id}
                alt={pokemon.name}
                lazy={false}
                sx={styles.heroImage}
              />
            </div>
            <div {...stylex.attrs(styles.chipBar)}>
              {#if pokemon.sprites.other["official-artwork"].front_shiny}
                <button
                  onclick={() => (isShiny = !isShiny)}
                  {...stylex.attrs(
                    styles.chip,
                    isShiny ? styles.chipActive : styles.chipInactive,
                  )}>{isShiny ? "★ Shiny" : "☆ Shiny"}</button
                >
              {/if}
              {#if pokemon.cries}
                <button
                  onclick={() => {
                    const a = new Audio(pokemon!.cries!);
                    a.volume = 0.4;
                    a.play();
                  }}
                  {...stylex.attrs(styles.chip, styles.chipInactive)}
                  aria-label="Play cry">🔊 Cry</button
                >
              {/if}
              <button
                onclick={onFav}
                {...stylex.attrs(
                  styles.chip,
                  fav ? styles.chipFav : styles.chipInactive,
                )}>{fav ? "★ Saved" : "☆ Save"}</button
              >
              <a
                href={resolve("/compare") + `?a=${pokemon.name}`}
                {...stylex.attrs(
                  styles.chip,
                  styles.chipInactive,
                  styles.chipLink,
                )}>⇄ Compare</a
              >
              <a
                href={resolve("/team-builder") + `?p=${teamParam}`}
                {...stylex.attrs(
                  styles.chip,
                  styles.chipInactive,
                  styles.chipLink,
                )}>⬡ Team</a
              >
              <button
                onclick={copyLink}
                {...stylex.attrs(
                  styles.chip,
                  styles.chipInactive,
                  styles.chipLink,
                )}>{linkCopied ? "Link copied!" : "🔗 Share"}</button
              >
            </div>
            <div {...stylex.attrs(styles.badgeCol)}>
              {#if pokemon.is_legendary}<span
                  {...stylex.attrs(styles.rankBadge, styles.legendaryBadge)}
                  >Legendary</span
                >{/if}
              {#if pokemon.is_mythical}<span
                  {...stylex.attrs(styles.rankBadge, styles.mythicalBadge)}
                  >Mythical</span
                >{/if}
            </div>
          </div>

          <div {...stylex.attrs(styles.identity)}>
            <span
              {...stylex.attrs(styles.dexNumber, dynamic.color(primaryColor))}
              >{formatId(pokemon.species_id)}</span
            >
            {#if pokemon.id !== pokemon.species_id}
              <span {...stylex.attrs(styles.formId)}>form #{pokemon.id}</span>
            {/if}
            {#if pokemon.genus}<span {...stylex.attrs(styles.genus)}
                >{pokemon.genus}</span
              >{/if}
            {#if pokemon.pokedex_numbers.length > 0}
              <div {...stylex.attrs(styles.dexRow)}>
                {#each pokemon.pokedex_numbers as entry}
                  <span
                    {...stylex.attrs(styles.dexPill)}
                    title={`${entry.dex} Pokédex`}
                    >{REGIONAL_DEX_LABELS[entry.dex] ?? formatName(entry.dex)} #{String(
                      entry.number,
                    ).padStart(3, "0")}</span
                  >
                {/each}
              </div>
            {/if}
            <h1 {...stylex.attrs(styles.name)}>
              {formatName(pokemon.name)}
            </h1>
            {#if pokemon.name !== pokemon.species_name}
              <p {...stylex.attrs(styles.formNote)}>
                {formLabel(pokemon.name, pokemon.species_name)} form of {formatName(
                  pokemon.species_name,
                )}
              </p>
            {/if}
            <div {...stylex.attrs(styles.typeRow)}>
              {#each pokemon.types as type}
                <a
                  href={resolve("/") + `?type=${type}`}
                  {...stylex.attrs(styles.typeLink)}
                  title={`Show ${formatName(type)}-type Pokémon`}
                  ><TypeBadge {type} size="md" /></a
                >
              {/each}
            </div>
            {#if pokemon.flavor_text}
              <p {...stylex.attrs(styles.flavor)}>
                "{pokemon.flavor_text}"
              </p>
            {/if}
          </div>

          <div {...stylex.attrs(shared.panel, styles.quickPanel)}>
            {#each quickStats as stat, i}
              <div
                {...stylex.attrs(
                  styles.qsCell,
                  i % 2 === 1 && styles.qsCellLeft,
                  i >= 2 && styles.qsCellTop,
                )}
              >
                <div {...stylex.attrs(styles.qsValue)}>{stat.value}</div>
                <div {...stylex.attrs(styles.qsLabel)}>
                  {stat.label}
                </div>
              </div>
            {/each}
          </div>

          {#if pokemon.forms?.length > 1}
            <div {...stylex.attrs(shared.panel, styles.formsPanel)}>
              <h3 {...stylex.attrs(styles.formsTitle)}>
                Forms ({pokemon.forms.length})
              </h3>
              <div {...stylex.attrs(styles.formsRow)}>
                {#each pokemon.forms as form}
                  <a
                    href={resolve(`/pokemon/${form.name}`)}
                    {...stylex.attrs(
                      styles.formCard,
                      form.name === pokemon.name
                        ? styles.formCardActive
                        : styles.formCardInactive,
                    )}
                    title={form.name}
                  >
                    <PokemonImage
                      src={form.image}
                      id={form.id}
                      alt={form.name}
                      lazy={false}
                      sx={styles.formImage}
                    />
                    <span {...stylex.attrs(styles.formLabel)}
                      >{formLabel(form.name, pokemon.species_name)}</span
                    >
                  </a>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <div {...stylex.attrs(styles.tabCol)}>
          <TabBar
            {tabs}
            active={tab}
            color={primaryColor}
            onchange={(id) => setTab(id as typeof tab)}
          />

          {#if tab === "overview"}
            <div {...stylex.attrs(styles.tabStack)}>
              <div {...stylex.attrs(shared.panel)}>
                <h2 {...stylex.attrs(styles.sectionTitle)}>Abilities</h2>
                <div {...stylex.attrs(styles.abilityList)}>
                  {#each pokemon.abilities as ability}
                    <div
                      {...stylex.attrs(
                        styles.abilityCard,
                        dynamic.backgroundColor(`${primaryColor}10`),
                        dynamic.borderColor(`${primaryColor}25`),
                      )}
                    >
                      <div {...stylex.attrs(styles.abilityHead)}>
                        <span {...stylex.attrs(styles.abilityName)}
                          >{formatName(ability.name)}</span
                        >
                        {#if ability.is_hidden}<span
                            {...stylex.attrs(styles.hiddenBadge)}>Hidden</span
                          >{/if}
                      </div>
                      {#if ability.description}<p
                          {...stylex.attrs(styles.abilityDesc)}
                        >
                          {ability.description}
                        </p>{/if}
                    </div>
                  {/each}
                </div>
              </div>

              {#if pokemon.evolution?.children?.length}
                <div {...stylex.attrs(shared.panel)}>
                  <h2 {...stylex.attrs(styles.sectionTitle)}>
                    Evolution Chain
                  </h2>
                  <EvolutionChain
                    stage={pokemon.evolution}
                    currentName={pokemon.name}
                    color={primaryColor}
                  />
                </div>
              {/if}

              {#if pokemon.locations?.length}
                <div {...stylex.attrs(shared.panel)}>
                  <h2 {...stylex.attrs(styles.sectionTitle)}>Locations</h2>
                  <div {...stylex.attrs(styles.twoColGrid)}>
                    {#each pokemon.locations as loc}
                      <div {...stylex.attrs(styles.locCard)}>
                        <div {...stylex.attrs(styles.locArea)}>
                          {loc.area}
                        </div>
                        <div {...stylex.attrs(styles.locMethod)}>
                          {loc.method}{loc.chance != null
                            ? ` · ${loc.chance}%`
                            : ""}
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {:else if tab === "stats"}
            <div {...stylex.attrs(shared.panel)}>
              <div {...stylex.attrs(styles.statsHead)}>
                <h2 {...stylex.attrs(styles.statsTitle)}>Base Stats</h2>
                <div
                  {...stylex.attrs(
                    styles.totalBadge,
                    dynamic.backgroundColor(`${primaryColor}22`),
                    dynamic.color(primaryColor),
                  )}
                >
                  {totalStats}
                </div>
              </div>
              <div {...stylex.attrs(styles.chartsCol)}>
                <div {...stylex.attrs(styles.radarWrap)}>
                  <RadarChart {pokemon} color={primaryColor} />
                </div>
                <div {...stylex.attrs(styles.barsWrap)}>
                  <StatBars {pokemon} color={primaryColor} />
                </div>
              </div>
            </div>
          {:else if tab === "matchups"}
            <div {...stylex.attrs(shared.panel)}>
              <h2 {...stylex.attrs(styles.sectionTitleWide)}>
                Type Effectiveness
              </h2>
              <TypeMatchup effectiveness={pokemon.type_effectiveness} />
            </div>
          {:else if tab === "moves"}
            <div {...stylex.attrs(shared.panel)}>
              <h2 {...stylex.attrs(styles.sectionTitle)}>Moves</h2>
              {#if movesLoading}
                <div {...stylex.attrs(styles.loadingWrap)}>
                  <Pokeball spinning sx={styles.spinner} />
                </div>
              {:else if moves}
                <div {...stylex.attrs(styles.moveTabs)}>
                  {#each ["level_up", "machine", "egg", "tutor"] as t}
                    {#if moveTabCounts[t as keyof typeof moveTabCounts] > 0}
                      <button
                        onclick={() => (activeMoveTab = t)}
                        {...stylex.attrs(
                          styles.moveTab,
                          activeMoveTab === t
                            ? styles.moveTabActive
                            : styles.moveTabInactive,
                          activeMoveTab === t
                            ? dynamic.backgroundColor(`${primaryColor}33`)
                            : null,
                        )}
                      >
                        {MOVE_TAB_LABELS[t]} ({moveTabCounts[
                          t as keyof typeof moveTabCounts
                        ]})
                      </button>
                    {/if}
                  {/each}
                </div>
                {#if activeMoveTab === "level_up" || activeMoveTab === "machine" || activeMoveTab === "egg" || activeMoveTab === "tutor"}
                  <div {...stylex.attrs(styles.twoColGrid)}>
                    {#each moves[activeMoveTab as keyof PokemonMoves] as m}
                      <MoveTooltip move={m}>
                        {#snippet children()}
                          <div {...stylex.attrs(styles.moveRow)}>
                            {#if activeMoveTab === "level_up"}
                              <span {...stylex.attrs(styles.moveLevel)}
                                >{m.level}</span
                              >
                            {/if}
                            <TypeBadge
                              type={m.type}
                              size="xs"
                              tooltip={false}
                            />
                            <span {...stylex.attrs(styles.moveName)}
                              >{formatName(m.name)}</span
                            >
                            <span {...stylex.attrs(styles.moveStats)}>
                              {m.power ?? "—"}/{m.accuracy ?? "—"}/{m.pp ?? "—"}
                            </span>
                          </div>
                        {/snippet}
                      </MoveTooltip>
                    {/each}
                  </div>
                {/if}
              {/if}
            </div>
          {:else if tab === "data"}
            <div {...stylex.attrs(shared.panel)}>
              <h2 {...stylex.attrs(styles.sectionTitleWide)}>Pokédex Data</h2>
              <div {...stylex.attrs(styles.dataGrid)}>
                {#each dexData as entry}
                  <div>
                    <div {...stylex.attrs(styles.dataLabel)}>
                      {entry.label}
                    </div>
                    <div
                      {...stylex.attrs(
                        styles.dataValue,
                        entry.capitalize && styles.capitalize,
                      )}
                    >
                      {entry.value}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
