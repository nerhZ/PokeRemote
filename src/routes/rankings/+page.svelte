<script lang="ts">
  import { getStatRankings } from "$lib/api";
  import {
    TYPE_COLORS,
    formatName,
    formatId,
    TOTAL_POKEMON,
    type StatRankings,
  } from "$lib/pokemon-types";
  import { resolve } from "$app/paths";
  import TypeBadge from "$lib/components/TypeBadge.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import PokemonImage from "$lib/components/PokemonImage.svelte";
  import LoadProgress from "$lib/components/LoadProgress.svelte";
  import Skeleton from "$lib/components/Skeleton.svelte";
  import { onMount } from "svelte";
  import * as stylex from "@stylexjs/stylex";
  import { shared } from "$lib/styles/shared.stylex";
  import { dynamic } from "../../lib/styles/dynamic.stylex";
  import { styles } from "./styles";

  let rankings = $state<StatRankings | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let activeStat = $state("total");
  let loadProgress = $state({ done: 0, total: 0 });

  const stats = [
    { key: "total", label: "Total", max: 720 },
    { key: "hp", label: "HP", max: 255 },
    { key: "attack", label: "Attack", max: 255 },
    { key: "defense", label: "Defense", max: 255 },
    { key: "special_attack", label: "Sp. Atk", max: 255 },
    { key: "special_defense", label: "Sp. Def", max: 255 },
    { key: "speed", label: "Speed", max: 255 },
    { key: "base_experience", label: "Base Exp", max: 700 },
    { key: "height", label: "Height", max: 25 },
    { key: "weight", label: "Weight", max: 1500 },
    { key: "moves_count", label: "Moves", max: 200 },
  ];

  async function loadRankings() {
    try {
      loading = true;
      error = null;
      const { data } = await getStatRankings((done, total) => {
        loadProgress = { done, total };
      });
      rankings = data;
    } catch (e: any) {
      if (!rankings) error = e.message;
    } finally {
      loading = false;
    }
  }

  onMount(() => loadRankings());

  let activeList = $derived(
    rankings ? (rankings[activeStat as keyof StatRankings] ?? []) : [],
  );
  let currentMax = $derived(
    stats.find((s) => s.key === activeStat)?.max ?? 255,
  );

  function medalStyle(i: number) {
    if (i === 0) return styles.medalGold;
    if (i === 1) return styles.medalSilver;
    if (i === 2) return styles.medalBronze;
    return styles.medalMuted;
  }
</script>

<div {...stylex.attrs(shared.toolShell, styles.shell)}>
  <div {...stylex.attrs(shared.toolHero)}>
    <h1 {...stylex.attrs(shared.toolHeroTitle)}>Stat Rankings</h1>
    <p {...stylex.attrs(shared.toolHeroText)}>
      Top 10 across all {TOTAL_POKEMON} forms. Click a row to open the Pokédex entry.
    </p>
  </div>

  <div {...stylex.attrs(styles.statTabs)}>
    {#each stats as s}
      <button
        onclick={() => (activeStat = s.key)}
        {...stylex.attrs(
          styles.statTab,
          activeStat === s.key ? styles.statTabActive : styles.statTabIdle,
        )}>{s.label}</button
      >
    {/each}
  </div>

  {#if loading}
    {#if loadProgress.total > 0}
      <LoadProgress
        done={loadProgress.done}
        total={loadProgress.total}
        noun="Pokémon"
      />
    {:else}
      <Skeleton rows={10} sx={styles.skeletonTall} grid={false} />
    {/if}
  {:else if error && !rankings}
    <EmptyState
      title="Could not load rankings"
      subtitle={error}
      actionLabel="Try again"
      onaction={loadRankings}
    />
  {:else if rankings && activeList.length === 0}
    <EmptyState
      title="No data"
      subtitle="No rankings available for this stat."
    />
  {:else if rankings}
    <div {...stylex.attrs(styles.list)}>
      {#each activeList as entry, i}
        <a
          href={resolve(`/pokemon/${entry.name}`)}
          {...stylex.attrs(styles.item, stylex.defaultMarker())}
        >
          <span {...stylex.attrs(styles.medal, medalStyle(i))}>#{i + 1}</span>
          <PokemonImage
            src={entry.image}
            id={entry.id}
            alt={entry.name}
            sx={styles.itemImage}
          />
          <div {...stylex.attrs(styles.itemBody)}>
            <div {...stylex.attrs(styles.itemName)}>
              {formatName(entry.name)}
            </div>
            <div {...stylex.attrs(styles.meta)}>
              <span {...stylex.attrs(styles.id)}>{formatId(entry.id)}</span>
              {#if entry.types}{#each entry.types as t}<TypeBadge
                    type={t}
                    size="xs"
                  />{/each}{/if}
            </div>
          </div>
          <div {...stylex.attrs(styles.valueCol)}>
            <div {...stylex.attrs(styles.value)}>{entry.value}</div>
            <div {...stylex.attrs(styles.bar)}>
              <div
                {...stylex.attrs(
                  styles.barFill,
                  dynamic.width(`${(entry.value / currentMax) * 100}%`),
                )}
              ></div>
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
