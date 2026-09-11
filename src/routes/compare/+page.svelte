<script lang="ts">
  import { page } from "$app/state";
  import { resolve } from "$app/paths";
  import { getAutocompleteList } from "$lib/api";
  import { pageUrlSync, selectPokemonSlot } from "$lib/url-state";
  import {
    TYPE_COLORS,
    STAT_LABELS,
    formatName,
    formatId,
    typeColor,
    statTotal,
    type PokemonDetail,
  } from "$lib/pokemon-types";
  import PokemonSearch from "$lib/components/PokemonSearch.svelte";
  import TypeBadge from "$lib/components/TypeBadge.svelte";
  import RadarChart from "$lib/components/RadarChart.svelte";
  import Pokeball from "$lib/components/Pokeball.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import PokemonImage from "$lib/components/PokemonImage.svelte";
  import StatBar from "$lib/components/StatBar.svelte";
  import ClearButton from "$lib/components/ClearButton.svelte";
  import { onMount, untrack } from "svelte";
  import * as stylex from "@stylexjs/stylex";
  import { shared } from "$lib/styles/shared.stylex";
  import { dynamic } from "../../lib/styles/dynamic.stylex";
  import { styles } from "./styles";

  let allNames: { name: string; id: number }[] = $state([]);
  let catalogTotal = $state(0);
  let searchA = $state("");
  let searchB = $state("");
  let pokemonA = $state<PokemonDetail | null>(null);
  let pokemonB = $state<PokemonDetail | null>(null);
  let loadingA = $state(false);
  let loadingB = $state(false);
  let slotError = $state("");
  let effectGen = 0;

  const sync = pageUrlSync("/compare");

  onMount(async () => {
    const catalog = await getAutocompleteList();
    allNames = catalog.results;
    catalogTotal = catalog.total;
  });

  $effect(() => {
    const gen = ++effectGen;
    const a = page.url.searchParams.get("a");
    const b = page.url.searchParams.get("b");
    if (!a && !b) {
      pokemonA = null;
      pokemonB = null;
      searchA = "";
      searchB = "";
      slotError = "";
      return;
    }
    (async () => {
      if (a && untrack(() => pokemonA?.name) !== a)
        await selectPokemonA(a, gen, true);
      if (b && untrack(() => pokemonB?.name) !== b)
        await selectPokemonB(b, gen, true);
    })();
  });

  function syncUrl() {
    const params = new URLSearchParams();
    if (pokemonA) params.set("a", pokemonA.name);
    if (pokemonB) params.set("b", pokemonB.name);
    sync.push(params);
  }

  function clearState() {
    sync.clear();
  }

  async function selectPokemonA(
    name: string,
    gen?: number,
    skipSync?: boolean,
  ) {
    searchA = name;
    slotError = "";
    await selectPokemonSlot(name, {
      gen,
      effectGen,
      setLoading: (v) => (loadingA = v),
      apply: (p) => {
        pokemonA = p;
        if (!skipSync) syncUrl();
      },
      onError: (msg) => (slotError = msg),
    });
  }

  async function selectPokemonB(
    name: string,
    gen?: number,
    skipSync?: boolean,
  ) {
    searchB = name;
    slotError = "";
    await selectPokemonSlot(name, {
      gen,
      effectGen,
      setLoading: (v) => (loadingB = v),
      apply: (p) => {
        pokemonB = p;
        if (!skipSync) syncUrl();
      },
      onError: (msg) => (slotError = msg),
    });
  }
</script>

<div {...stylex.attrs(shared.toolShell)}>
  <div {...stylex.attrs(shared.toolHero)}>
    <div {...stylex.attrs(styles.heroRow)}>
      <div>
        <h1 {...stylex.attrs(shared.toolHeroTitle)}>Compare Pokémon</h1>
        <p {...stylex.attrs(shared.toolHeroText)}>
          Side-by-side stats with a shared radar. Search includes all {catalogTotal ||
            "…"} forms. Share via
          <code {...stylex.attrs(styles.accent)}>?a=</code>
          /
          <code {...stylex.attrs(styles.accent)}>?b=</code>.
        </p>
      </div>
      <ClearButton onclick={clearState} />
    </div>
  </div>

  <div {...stylex.attrs(styles.pickGrid)}>
    <div {...stylex.attrs(shared.panel, styles.panelP4)}>
      <div {...stylex.attrs(styles.slotLabel)}>Pokémon A</div>
      <PokemonSearch
        bind:value={searchA}
        options={allNames}
        onselect={selectPokemonA}
      />
      {#if loadingA}<div {...stylex.attrs(styles.loadingRow)}>
          <Pokeball spinning sx={styles.pokeball} />
        </div>{/if}
    </div>
    <div {...stylex.attrs(shared.panel, styles.panelP4)}>
      <div {...stylex.attrs(styles.slotLabel)}>Pokémon B</div>
      <PokemonSearch
        bind:value={searchB}
        options={allNames}
        onselect={selectPokemonB}
      />
      {#if loadingB}<div {...stylex.attrs(styles.loadingRow)}>
          <Pokeball spinning sx={styles.pokeball} />
        </div>{/if}
    </div>
  </div>

  {#if slotError}
    <div {...stylex.attrs(styles.errorBox)} role="alert">
      {slotError}
    </div>
  {/if}

  {#if !pokemonA && !pokemonB}
    <EmptyState
      title="Pick two Pokémon"
      subtitle="Search above to start comparing stats, types, and radar profiles."
    />
  {:else}
    <div {...stylex.attrs(styles.vsGrid)}>
      <div {...stylex.attrs(styles.vsBadge)}>VS</div>
      {#each [pokemonA, pokemonB] as p, idx}
        {#if p}
          {@const color = typeColor(p.types)}
          <div
            {...stylex.attrs(
              shared.panel,
              dynamic.boxShadow(`inset 0 0 0 1px ${color}33`),
            )}
          >
            <a
              href={resolve(`/pokemon/${p.name}`)}
              {...stylex.attrs(styles.cardLink)}
            >
              <PokemonImage
                src={p.sprites.other["official-artwork"].front_default}
                id={p.id}
                alt={p.name}
                sx={styles.artwork}
              />
              <div>
                <div {...stylex.attrs(styles.name)}>
                  {formatName(p.name)}
                </div>
                <div {...stylex.attrs(styles.idText)}>
                  {formatId(p.id)}
                </div>
                <div {...stylex.attrs(styles.typeRow)}>
                  {#each p.types as t}<TypeBadge type={t} size="xs" />{/each}
                </div>
              </div>
            </a>
            <div {...stylex.attrs(styles.stats)}>
              {#each p.stats as stat}
                <StatBar
                  label={STAT_LABELS[stat.name]}
                  value={stat.base_stat}
                  {color}
                  size="sm"
                />
              {/each}
              <div {...stylex.attrs(styles.total)}>
                Total {statTotal(p.stats)}
              </div>
            </div>
          </div>
        {:else}
          <div {...stylex.attrs(shared.panel, styles.emptySlot)}>
            Select Pokémon {idx === 0 ? "A" : "B"}
          </div>
        {/if}
      {/each}
    </div>

    {#if pokemonA && pokemonB}
      {@const colorA = typeColor(pokemonA.types, "#3e7bff")}
      {@const colorB = (() => {
        const a = pokemonA.types[0];
        const alt = pokemonB.types.find((t) => t !== a);
        return alt ? TYPE_COLORS[alt] : "#ff3e3e";
      })()}
      <div {...stylex.attrs(shared.panel, styles.panelMb6)}>
        <h2 {...stylex.attrs(styles.sectionTitle)}>Shared Radar</h2>
        <div {...stylex.attrs(styles.radarWrap)}>
          <RadarChart
            pokemon={pokemonA}
            color={colorA}
            overlay={pokemonB}
            overlayColor={colorB}
          />
        </div>
      </div>

      <div {...stylex.attrs(shared.panel)}>
        <h2 {...stylex.attrs(styles.sectionTitle)}>Stat Difference</h2>
        <div {...stylex.attrs(styles.diffs)}>
          {#each pokemonA.stats as statA, i}
            {@const statB = pokemonB.stats[i]}
            {@const diff = statA.base_stat - statB.base_stat}
            {@const maxBoth = Math.max(statA.base_stat, statB.base_stat) || 1}
            {@const leftW = (statA.base_stat / maxBoth) * 100}
            {@const rightW = (statB.base_stat / maxBoth) * 100}
            {@const totalW = leftW + rightW}
            {@const leftWS = (leftW / totalW) * 100}
            {@const rightWS = (rightW / totalW) * 100}
            <div {...stylex.attrs(styles.diffRow)}>
              <span {...stylex.attrs(styles.diffLabel)}
                >{STAT_LABELS[statA.name]}</span
              >
              <span
                {...stylex.attrs(styles.diffValueLeft, dynamic.color(colorA))}
                >{statA.base_stat}</span
              >
              <div {...stylex.attrs(styles.diffTrack)}>
                <div
                  {...stylex.attrs(
                    styles.diffFill,
                    dynamic.width(`${leftWS}%`),
                    dynamic.background(colorA),
                  )}
                ></div>
                <div
                  {...stylex.attrs(
                    styles.diffFill,
                    dynamic.width(`${rightWS}%`),
                    dynamic.background(colorB),
                  )}
                ></div>
              </div>
              <span
                {...stylex.attrs(styles.diffValueRight, dynamic.color(colorB))}
                >{statB.base_stat}</span
              >
              <span
                {...stylex.attrs(
                  styles.diffDelta,
                  diff > 0
                    ? styles.diffPos
                    : diff < 0
                      ? styles.diffNeg
                      : styles.diffMuted,
                )}>{diff > 0 ? `+${diff}` : diff || ""}</span
              >
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>
