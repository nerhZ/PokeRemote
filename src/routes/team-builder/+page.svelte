<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { getPokemonDetail, getAutocompleteList } from "$lib/api";
  import {
    TYPE_COLORS,
    ALL_TYPES,
    formatName,
    type PokemonDetail,
  } from "$lib/pokemon-types";
  import { saveTeam, getSavedTeams } from "$lib/storage";
  import PokemonPicker from "$lib/components/PokemonPicker.svelte";
  import TypeBadge from "$lib/components/TypeBadge.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import { onMount } from "svelte";

  let allNames: { name: string; id: number }[] = $state([]);
  let search = $state("");
  let team: PokemonDetail[] = $state([]);
  let loading = $state(false);
  let teamName = $state("My Team");
  let saved = $state<ReturnType<typeof getSavedTeams>>([]);
  let copied = $state(false);

  onMount(async () => {
    saved = getSavedTeams();
    try {
      const catalog = await getAutocompleteList({});
      allNames = catalog.results;
    } catch {}
  });

  $effect(() => {
    const p = page.url.searchParams.get("p");
    if (!p) return;
    const names = p.split(",").filter(Boolean).slice(0, 6);
    const current = team.map((t) => t.name).join(",");
    if (names.join(",") === current) return;
    (async () => {
      for (const n of names) {
        if (team.some((t) => t.name === n)) continue;
        try {
          const d = await getPokemonDetail(n);
          if (!team.some((t) => t.id === d.id)) team = [...team, d];
        } catch {}
      }
    })();
  });

  function syncUrl() {
    const params = new URLSearchParams();
    if (team.length) params.set("p", team.map((t) => t.name).join(","));
    const q = params.toString();
    goto(q ? resolve("/team-builder") + `?${q}` : resolve("/team-builder"), {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
  }

  async function addToTeam(name: string) {
    if (team.length >= 6) return;
    search = "";
    loading = true;
    try {
      const detail = await getPokemonDetail(name);
      if (!team.some((t) => t.id === detail.id)) {
        team = [...team, detail];
        syncUrl();
      }
    } catch {
    } finally {
      loading = false;
    }
  }

  function removeFromTeam(id: number) {
    team = team.filter((p) => p.id !== id);
    syncUrl();
  }

  function exportTeam() {
    saved = saveTeam(teamName || "My Team", team);
    const url = `${window.location.origin}${resolve("/team-builder")}?p=${team.map((t) => t.name).join(",")}`;
    navigator.clipboard?.writeText(url);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  let coverage = $derived.by(() => {
    const result: Record<string, number> = {};
    for (const t of ALL_TYPES) result[t] = 0;
    for (const p of team) {
      const e = p.type_effectiveness;
      for (const t of e.two_x_weak) result[t] += 1;
      for (const t of e.four_x_weak) result[t] += 2;
      for (const t of e.half_resist) result[t] -= 1;
      for (const t of e.quarter_resist) result[t] -= 2;
      for (const t of e.immune) result[t] = -99;
    }
    return result;
  });

  let teamWeak = $derived(ALL_TYPES.filter((t) => coverage[t] >= 2));
  let teamSafe = $derived(ALL_TYPES.filter((t) => coverage[t] <= -1));
</script>

<div class="tool-shell">
  <div class="tool-hero">
    <h1>Team Builder</h1>
    <p>Six slots, type heat map, shareable links, and local team saves.</p>
  </div>

  <div class="panel mb-6 max-w-xl p-4!">
    <PokemonPicker
      bind:value={search}
      options={allNames.filter((n) => !team.some((t) => t.id === n.id))}
      disabled={team.length >= 6}
      placeholder={team.length >= 6 ? "Team is full" : "Add a Pokémon..."}
      onselect={addToTeam}
    />
    {#if loading}<div
        class="mt-2 h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"
      ></div>{/if}
  </div>

  <div class="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
    {#each Array(6) as _, i}
      {#if team[i]}
        {@const p = team[i]}
        {@const color = TYPE_COLORS[p.types[0]] || "#777"}
        <a
          href={resolve(`/pokemon/${p.name}`)}
          class="panel relative p-3! text-center transition-all hover:-translate-y-1 no-underline"
          style="box-shadow: inset 0 0 0 1px {color}40"
        >
          <button
            onclick={(e) => { e.preventDefault(); removeFromTeam(p.id); }}
            class="bg-pokemon-red/20 text-pokemon-red absolute top-1.5 right-1.5 z-10 h-6 w-6 cursor-pointer rounded-md border-0 text-xs font-bold hover:bg-pokemon-red/40 transition-colors"
            >×</button
          >
          <img
            src={p.sprites.other["official-artwork"].front_default}
            alt={p.name}
            class="mx-auto h-16 w-16 object-contain"
          />
          <div class="mt-1 truncate text-xs font-bold" style="color: var(--text)">
            {formatName(p.name)}
          </div>
          <div class="mt-1 flex justify-center gap-0.5">
            {#each p.types as t}<TypeBadge type={t} size="xs" />{/each}
          </div>
        </a>
      {:else}
        <div
          class="flex min-h-36 items-center justify-center rounded-3xl border border-dashed border-white/10 text-xs text-white/20"
        >
          Slot {i + 1}
        </div>
      {/if}
    {/each}
  </div>

  {#if team.length === 0}
    <EmptyState
      title="Build your team"
      subtitle="Add up to 6 Pokémon to see defensive coverage and export a share link."
    />
  {:else}
    <div class="mb-6 grid gap-4 md:grid-cols-2">
      <div class="panel">
        <h2 class="mb-4 text-lg font-bold">Type Heat Map</h2>
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {#each ALL_TYPES as t}
            {@const c = coverage[t]}
            <div
              class="rounded-lg px-2 py-2 text-center text-[10px] font-bold uppercase"
              style="background-color: {c >= 2
                ? 'rgba(255,62,62,0.2)'
                : c <= -1
                  ? 'rgba(74,222,128,0.2)'
                  : 'var(--surface-2)'}; border: 1px solid {c >= 2
                ? 'rgba(255,62,62,0.3)'
                : c <= -1
                  ? 'rgba(74,222,128,0.3)'
                  : 'var(--border)'}"
            >
              <span class="block" style="color: {TYPE_COLORS[t]}"
                >{t.slice(0, 4)}</span
              >
              <span class="opacity-60"
                >{c >= 2 ? "Weak" : c <= -1 ? "Safe" : "OK"}</span
              >
            </div>
          {/each}
        </div>
      </div>
      <div class="panel space-y-4">
        <div>
          <h3
            class="text-pokemon-red mb-2 text-xs font-bold tracking-wider uppercase"
          >
            Shared weaknesses
          </h3>
          <div class="flex flex-wrap gap-1.5">
            {#if teamWeak.length === 0}<span class="text-xs text-white/40"
                >None — nice!</span
              >
            {:else}{#each teamWeak as t}<TypeBadge
                  type={t}
                  size="sm"
                />{/each}{/if}
          </div>
        </div>
        <div>
          <h3
            class="text-pokemon-green mb-2 text-xs font-bold tracking-wider uppercase"
          >
            Resistances
          </h3>
          <div class="flex flex-wrap gap-1.5">
            {#if teamSafe.length === 0}<span class="text-xs text-white/40"
                >None</span
              >
            {:else}{#each teamSafe as t}<TypeBadge
                  type={t}
                  size="sm"
                />{/each}{/if}
          </div>
        </div>
        <div
          class="flex flex-wrap items-center gap-2 border-t border-white/6 pt-3"
        >
          <input
            bind:value={teamName}
            class="focus:border-accent/50 min-w-30 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
            placeholder="Team name"
          />
          <button
            onclick={exportTeam}
            class="bg-accent hover:bg-accent/80 cursor-pointer rounded-xl border-0 px-4 py-2 text-sm font-semibold text-white"
            >{copied ? "Link copied!" : "Save & share"}</button
          >
        </div>
        {#if saved.length}
          <div>
            <h3
              class="mb-2 text-xs font-bold tracking-wider text-white/40 uppercase"
            >
              Saved teams
            </h3>
            <div class="space-y-1">
              {#each saved.slice(0, 5) as t}
                <div
                  class="rounded-lg bg-white/2 px-2 py-1.5 text-xs text-white/60"
                >
                  {t.name}: {t.names.map(formatName).join(", ")}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
