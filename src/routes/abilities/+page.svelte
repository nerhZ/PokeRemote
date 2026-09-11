<script lang="ts">
  import { resolve } from "$app/paths";
  import {
    getAllAbilities,
    getAbilityPokemon,
    type AbilityEntry,
  } from "$lib/api";
  import {
    formatName,
    generationLabel,
    generationShortLabel,
    GEN_COLORS,
  } from "$lib/pokemon-types";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import SearchInput from "$lib/components/SearchInput.svelte";
  import FilterChip from "$lib/components/FilterChip.svelte";
  import Skeleton from "$lib/components/Skeleton.svelte";
  import LearnerList from "$lib/components/LearnerList.svelte";
  import { onMount } from "svelte";
  import * as stylex from "@stylexjs/stylex";
  import { shared } from "$lib/styles/shared.stylex";
  import { dynamic } from "../../lib/styles/dynamic.stylex";
  import { styles } from "./styles";

  let abilities = $state<AbilityEntry[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let search = $state("");
  let genFilter = $state("");

  const GENS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

  onMount(async () => {
    try {
      abilities = await getAllAbilities();
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  let filtered = $derived.by(() => {
    const q = search.trim().toLowerCase();
    return abilities.filter((a) => {
      if (q && !a.name.includes(q)) return false;
      if (genFilter && generationLabel(a.generation) !== genFilter)
        return false;
      return true;
    });
  });

  let genAvailable = $derived.by(() => {
    const q = search.trim().toLowerCase();
    const pool = q ? abilities.filter((a) => a.name.includes(q)) : abilities;
    return new Set(pool.map((a) => generationLabel(a.generation)));
  });
</script>

<div {...stylex.attrs(shared.toolShell)}>
  <div {...stylex.attrs(shared.toolHero)}>
    <h1 {...stylex.attrs(shared.toolHeroTitle)}>Ability Dex</h1>
    <p {...stylex.attrs(shared.toolHeroText)}>
      All abilities with short effects and how many Pokémon have them. {abilities.length
        ? `${abilities.length} total`
        : ""}
    </p>
  </div>

  <div {...stylex.attrs(styles.filters)}>
    <SearchInput
      bind:value={search}
      placeholder="Search abilities..."
      sx={styles.searchInput}
    />
    <div {...stylex.attrs(styles.chipRow)}>
      <FilterChip
        label="All gens"
        active={genFilter === ""}
        onclick={() => (genFilter = "")}
      />
      {#each GENS as g}
        {@const label = `Gen ${g}`}
        <FilterChip
          {label}
          active={genFilter === label}
          disabled={!loading && genFilter !== label && !genAvailable.has(label)}
          onclick={() => (genFilter = genFilter === label ? "" : label)}
        />
      {/each}
    </div>
  </div>

  {#if loading}
    <Skeleton rows={12} />
  {:else if error}
    <EmptyState title="Failed to load abilities" subtitle={error} />
  {:else if filtered.length === 0}
    <EmptyState
      title="No abilities match"
      subtitle="Try a different search or generation filter."
    />
  {:else}
    <div {...stylex.attrs(styles.grid)}>
      {#each filtered as a}
        <div {...stylex.attrs(shared.panel, styles.card)}>
          <div {...stylex.attrs(styles.cardHead)}>
            <span {...stylex.attrs(styles.cardName)}>{formatName(a.name)}</span>
            {#if a.generation}
              {@const gen = generationLabel(a.generation)}
              {#if gen}
                {@const color = GEN_COLORS[gen.split(" ")[1]] ?? "#777"}
                <a
                  href={resolve("/") + `?gen=${generationShortLabel(gen)}`}
                  {...stylex.attrs(
                    shared.grow,
                    styles.genBadge,
                    dynamic.color(color),
                    dynamic.borderColor(`${color}40`),
                    dynamic.background(`${color}18`),
                  )}>{gen}</a
                >
              {/if}
            {/if}
          </div>
          {#if a.effect}
            <p {...stylex.attrs(styles.effect)}>
              {a.effect}
            </p>
          {:else}
            <p {...stylex.attrs(styles.effectMissing)}>
              No ability description provided.
            </p>
          {/if}
          {#if a.pokemon_count > 0}
            <LearnerList
              name={a.name}
              count={a.pokemon_count}
              label={(n) => `${n} Pokémon`}
              fetchNames={getAbilityPokemon}
            />
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
