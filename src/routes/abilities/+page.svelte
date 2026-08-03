<script lang="ts">
  import { getAllAbilities, type AbilityEntry } from "$lib/api";
  import { formatName, generationLabel, GEN_COLORS } from "$lib/pokemon-types";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import SearchInput from "$lib/components/SearchInput.svelte";
  import FilterChip from "$lib/components/FilterChip.svelte";
  import { onMount } from "svelte";

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

<div class="tool-shell">
  <div class="tool-hero">
    <h1>Ability Dex</h1>
    <p>
      All abilities with short effects and how many Pokémon have them. {abilities.length
        ? `${abilities.length} total`
        : ""}
    </p>
  </div>

  <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
    <SearchInput
      bind:value={search}
      placeholder="Search abilities..."
      class="md:max-w-xs"
    />
    <div class="flex flex-wrap items-center gap-1.5">
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
    <div class="flex justify-center py-24">
      <LoadingSpinner size="lg" />
    </div>
  {:else if error}
    <EmptyState title="Failed to load abilities" subtitle={error} />
  {:else if filtered.length === 0}
    <EmptyState title="No abilities match" subtitle="No abilities match." />
  {:else}
    <div class="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {#each filtered as a}
        <div class="panel flex flex-col gap-2 p-4!">
          <div class="flex items-center justify-between gap-2">
            <span class="truncate text-sm font-bold">{formatName(a.name)}</span>
            <div class="flex shrink-0 gap-1.5 text-[10px]">
              {#if a.generation}
                {@const gen = generationLabel(a.generation)}
                {#if gen}
                  {@const color = GEN_COLORS[gen.split(" ")[1]] ?? "#777"}
                  <span
                    class="rounded-full border px-2 py-0.5 font-bold"
                    style="color: {color}; border-color: {color}40; background: {color}18"
                    >{gen}</span
                  >
                {/if}
              {/if}
              <span
                class="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-bold text-white/60"
                >{a.pokemon_count} Pokémon</span
              >
            </div>
          </div>
          {#if a.effect}
            <p class="line-clamp-3 text-xs leading-relaxed text-white/50">
              {a.effect}
            </p>
          {:else}
            <p class="text-xs leading-relaxed text-white/40 italic">
              No ability description provided.
            </p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
