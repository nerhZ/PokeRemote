<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { getPokemonDetail, getAutocompleteList } from "$lib/api";
  import {
    TYPE_COLORS,
    formatName,
    type PokemonDetail,
  } from "$lib/pokemon-types";
  import PokemonPicker from "$lib/components/PokemonPicker.svelte";
  import TypeBadge from "$lib/components/TypeBadge.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import { onMount } from "svelte";

  let allNames: { name: string; id: number }[] = $state([]);
  let catalogTotal = $state(0);
  let searchA = $state("");
  let searchB = $state("");
  let pokemonA = $state<PokemonDetail | null>(null);
  let pokemonB = $state<PokemonDetail | null>(null);
  let loadingA = $state(false);
  let loadingB = $state(false);
  let effectGen = 0;

  const statLabels: Record<string, string> = {
    hp: "HP",
    attack: "ATK",
    defense: "DEF",
    "special-attack": "SP.ATK",
    "special-defense": "SP.DEF",
    speed: "SPD",
  };

  onMount(async () => {
    try {
      const catalog = await getAutocompleteList({});
      allNames = catalog.results;
      catalogTotal = catalog.total;
    } catch {}
  });

  $effect(() => {
    const gen = ++effectGen;
    const a = page.url.searchParams.get("a");
    const b = page.url.searchParams.get("b");
    (async () => {
      if (a && pokemonA?.name !== a) await selectPokemonA(a, gen);
      if (b && pokemonB?.name !== b) await selectPokemonB(b, gen);
    })();
  });

  function syncUrl() {
    const params = new URLSearchParams();
    if (pokemonA) params.set("a", pokemonA.name);
    if (pokemonB) params.set("b", pokemonB.name);
    const q = params.toString();
    goto(q ? resolve("/compare") + `?${q}` : resolve("/compare"), {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
  }

  async function selectPokemonA(name: string, gen?: number) {
    searchA = name;
    loadingA = true;
    try {
      const p = await getPokemonDetail(name);
      if (gen !== undefined && gen !== effectGen) return;
      pokemonA = p;
      syncUrl();
    } catch {
    } finally {
      loadingA = false;
    }
  }

  async function selectPokemonB(name: string, gen?: number) {
    searchB = name;
    loadingB = true;
    try {
      const p = await getPokemonDetail(name);
      if (gen !== undefined && gen !== effectGen) return;
      pokemonB = p;
      syncUrl();
    } catch {
    } finally {
      loadingB = false;
    }
  }

  function radarPoints(p: PokemonDetail, color: string) {
    return p.stats
      .map((s, i) => {
        const angle = -Math.PI / 2 + (i * Math.PI) / 3;
        const r = (s.base_stat / 255) * 80;
        return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
      })
      .join(" ");
  }
</script>

<div class="tool-shell">
  <div class="tool-hero">
    <h1>Compare Pokémon</h1>
    <p>
      Side-by-side stats with a shared radar. Search includes all {catalogTotal ||
        "…"} forms. Share via <code class="text-accent">?a=</code> /
      <code class="text-accent">?b=</code>.
    </p>
  </div>

  <div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
    <div class="panel p-4!">
      <div
        class="mb-2 text-xs font-bold tracking-wider text-white/40 uppercase"
      >
        Pokémon A
      </div>
      <PokemonPicker
        bind:value={searchA}
        options={allNames}
        onselect={selectPokemonA}
      />
      {#if loadingA}<div
          class="mt-3 h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"
        ></div>{/if}
    </div>
    <div class="panel p-4!">
      <div
        class="mb-2 text-xs font-bold tracking-wider text-white/40 uppercase"
      >
        Pokémon B
      </div>
      <PokemonPicker
        bind:value={searchB}
        options={allNames}
        onselect={selectPokemonB}
      />
      {#if loadingB}<div
          class="mt-3 h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"
        ></div>{/if}
    </div>
  </div>

  {#if !pokemonA && !pokemonB}
    <EmptyState
      title="Pick two Pokémon"
      subtitle="Search above to start comparing stats, types, and radar profiles."
    />
  {:else}
    <div class="relative mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div
        class="bg-accent absolute top-1/2 left-1/2 z-10 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-(--bg) font-black text-white shadow-xl md:flex"
      >
        VS
      </div>
      {#each [pokemonA, pokemonB] as p, idx}
        {#if p}
          {@const color = TYPE_COLORS[p.types[0]] || "#777"}
          <div class="panel" style="box-shadow: inset 0 0 0 1px {color}33">
            <div class="mb-5 flex items-center gap-4">
              <img
                src={p.sprites.other["official-artwork"].front_default}
                alt={p.name}
                class="h-20 w-20 object-contain drop-shadow-xl"
              />
              <div>
                <div class="text-xl font-black">{formatName(p.name)}</div>
                <div class="text-xs text-white/40">
                  #{String(p.id).padStart(3, "0")}
                </div>
                <div class="mt-1.5 flex gap-1">
                  {#each p.types as t}<TypeBadge type={t} size="xs" />{/each}
                </div>
              </div>
            </div>
            <div class="space-y-2">
              {#each p.stats as stat}
                <div class="flex items-center gap-2">
                  <span
                    class="w-12 text-right text-[10px] font-bold text-white/45"
                    >{statLabels[stat.name]}</span
                  >
                  <span class="w-7 text-xs font-black" style="color: {color}"
                    >{stat.base_stat}</span
                  >
                  <div
                    class="h-1.5 flex-1 overflow-hidden rounded-full bg-white/6"
                  >
                    <div
                      class="h-full rounded-full"
                      style="width: {(stat.base_stat / 255) *
                        100}%; background: {color}"
                    ></div>
                  </div>
                </div>
              {/each}
              <div
                class="border-t border-white/6 pt-2 text-xs font-bold text-white/60"
              >
                Total {p.stats.reduce((s, v) => s + v.base_stat, 0)}
              </div>
            </div>
          </div>
        {:else}
          <div
            class="panel flex min-h-64 items-center justify-center text-sm text-white/30"
          >
            Select Pokémon {idx === 0 ? "A" : "B"}
          </div>
        {/if}
      {/each}
    </div>

    {#if pokemonA && pokemonB}
      {@const colorA = TYPE_COLORS[pokemonA.types[0]] || "#777"}
      {@const colorB = TYPE_COLORS[pokemonB.types[0]] || "#777"}
      <div class="panel mb-6">
        <h2 class="mb-4 text-lg font-bold">Shared Radar</h2>
        <div class="flex justify-center">
          <svg viewBox="0 0 200 200" class="w-full max-w-72">
            {#each [0.25, 0.5, 0.75, 1] as lvl}
              {@const pts = Array.from({ length: 6 }, (_, i) => {
                const a = -Math.PI / 2 + (i * Math.PI) / 3;
                const r = 80 * lvl;
                return `${100 + r * Math.cos(a)},${100 + r * Math.sin(a)}`;
              }).join(" ")}
              <polygon
                points={pts}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                stroke-width="1"
              />
            {/each}
            <polygon
              points={radarPoints(pokemonA, colorA)}
              fill="{colorA}25"
              stroke={colorA}
              stroke-width="2"
            />
            <polygon
              points={radarPoints(pokemonB, colorB)}
              fill="{colorB}20"
              stroke={colorB}
              stroke-width="2"
              stroke-dasharray="4 2"
            />
          </svg>
        </div>
        <div class="mt-2 flex justify-center gap-4 text-xs">
          <span style="color: {colorA}">● {formatName(pokemonA.name)}</span>
          <span style="color: {colorB}">○ {formatName(pokemonB.name)}</span>
        </div>
      </div>

      <div class="panel">
        <h2 class="mb-4 text-lg font-bold">Stat Difference</h2>
        <div class="space-y-2.5">
          {#each pokemonA.stats as statA, i}
            {@const statB = pokemonB.stats[i]}
            {@const diff = statA.base_stat - statB.base_stat}
            {@const maxBoth = Math.max(statA.base_stat, statB.base_stat) || 1}
            {@const leftW = Math.max(
              0,
              Math.min(100, (statA.base_stat / maxBoth) * 100),
            )}
            {@const rightW =
              diff > 0
                ? 0
                : Math.max(
                    0,
                    Math.min(100, (statB.base_stat / maxBoth) * 100 - leftW),
                  )}
            <div class="flex items-center gap-3">
              <span class="w-12 text-right text-[10px] font-bold text-white/45"
                >{statLabels[statA.name]}</span
              >
              <span
                class="w-7 text-right text-xs font-bold"
                style="color: {colorA}">{statA.base_stat}</span
              >
              <div
                class="flex h-2 flex-1 overflow-hidden rounded-full bg-white/4"
              >
                <div
                  class="h-full"
                  style="width: {leftW}%; background: {colorA}"
                ></div>
                <div
                  class="h-full"
                  style="width: {rightW}%; background: {colorB}"
                ></div>
              </div>
              <span class="w-7 text-xs font-bold" style="color: {colorB}"
                >{statB.base_stat}</span
              >
              <span
                class="w-10 text-right text-[10px] font-bold"
                style="color: {diff > 0
                  ? '#4ade80'
                  : diff < 0
                    ? '#f87171'
                    : 'rgba(255,255,255,0.3)'}"
                >{diff > 0 ? `+${diff}` : diff || ""}</span
              >
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>
