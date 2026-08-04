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
  import Skeleton from "$lib/components/Skeleton.svelte";
  import { onMount } from "svelte";

  let rankings = $state<StatRankings | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let activeStat = $state("total");

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
      const { data } = await getStatRankings();
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

  function medalColor(i: number) {
    if (i === 0) return "#ffcb05";
    if (i === 1) return "#c0c0c0";
    if (i === 2) return "#cd7f32";
    return "var(--muted)";
  }
</script>

<div class="tool-shell max-w-3xl">
  <div class="tool-hero">
    <h1>Stat Rankings</h1>
    <p>
      Top 10 across all {TOTAL_POKEMON} forms. Click a row to open the Pokédex entry.
    </p>
  </div>

  <div class="mb-6 flex flex-wrap gap-2">
    {#each stats as s}
      <button
        onclick={() => (activeStat = s.key)}
        class="cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold tracking-wide uppercase {activeStat ===
        s.key
          ? 'bg-accent border-accent text-white'
          : 'border-white/10 bg-white/5 text-white/50 hover:border-white/25'}"
        >{s.label}</button
      >
    {/each}
  </div>

  {#if loading}
    <Skeleton rows={10} class="h-16" grid={false} />
  {:else if error && !rankings}
    <EmptyState title="Could not load rankings" subtitle={error} />
  {:else if rankings && activeList.length === 0}
    <EmptyState
      title="No data"
      subtitle="No rankings available for this stat."
    />
  {:else if rankings}
    <div class="space-y-2">
      {#each activeList as entry, i}
        <a
          href={resolve(`/pokemon/${entry.name}`)}
          class="group flex items-center gap-3 rounded-2xl border border-white/6 bg-white/3 p-3.5 no-underline transition-all hover:border-white/20 hover:bg-white/5"
        >
          <span
            class="w-8 text-center text-lg font-black"
            style="color: {medalColor(i)}">#{i + 1}</span
          >
          <img
            src={entry.image}
            alt={entry.name}
            class="h-12 w-12 object-contain transition-transform group-hover:scale-110"
          />
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-bold text-white">
              {formatName(entry.name)}
            </div>
            <div class="mt-0.5 flex items-center gap-1.5">
              <span class="text-[10px] text-white/30">{formatId(entry.id)}</span
              >
              {#if entry.types}{#each entry.types as t}<TypeBadge
                    type={t}
                    size="xs"
                  />{/each}{/if}
            </div>
          </div>
          <div class="text-right">
            <div class="text-lg font-black text-white">{entry.value}</div>
            <div
              class="mt-1 ml-auto h-1.5 w-20 overflow-hidden rounded-full bg-white/6"
            >
              <div
                class="bg-accent h-full rounded-full"
                style="width: {(entry.value / currentMax) * 100}%"
              ></div>
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
