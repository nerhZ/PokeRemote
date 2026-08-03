<script lang="ts">
  import { onMount } from "svelte";
  import { getSpeciesIds } from "$lib/api";
  import { getCatalog } from "$lib/url-state";
  import { artworkUrl, formatName } from "$lib/pokemon-types";
  import PokemonSearch from "$lib/components/PokemonSearch.svelte";
  import Pokeball from "$lib/components/Pokeball.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";

  let catalog = $state<{ name: string; id: number }[]>([]);
  let target = $state<{ name: string; id: number } | null>(null);
  let guess = $state("");
  let revealed = $state(false);
  let streak = $state(0);
  let hint = $state("");
  let loading = $state(true);
  let error = $state(false);

  async function newRound() {
    revealed = false;
    hint = "";
    guess = "";
    try {
      const ids = await getSpeciesIds();
      const id = ids[Math.floor(Math.random() * ids.length)];
      const entry = catalog.find((c) => c.id === id);
      if (!entry) throw new Error("no catalog entry");
      target = entry;
    } catch {
      error = true;
    }
  }

  onMount(async () => {
    catalog = (await getCatalog()).results;
    loading = false;
    if (catalog.length === 0) {
      error = true;
    } else {
      await newRound();
    }
  });

  function onGuess(name: string) {
    if (!target || revealed) return;
    if (name.toLowerCase() === target.name.toLowerCase()) {
      revealed = true;
      streak += 1;
    } else {
      hint = `Not ${formatName(name)} — try again!`;
      setTimeout(() => (hint = ""), 2500);
    }
  }

  function skip() {
    if (!target) return;
    revealed = true;
    streak = 0;
  }
</script>

<div class="tool-shell max-w-5xl">
  <div class="tool-hero">
    <h1>Who's That Pokémon?</h1>
    <p>Guess the silhouette. Consecutive correct answers build your streak.</p>
  </div>

  {#if loading}
    <div class="flex justify-center py-24">
      <Pokeball spinning />
    </div>
  {:else if error}
    <EmptyState
      title="Couldn't load Pokémon"
      subtitle="Check your connection and try again."
      actionLabel="Try again"
      onaction={() => window.location.reload()}
    />
  {:else if target}
    <div class="panel text-center">
      <div class="mb-5 flex items-center justify-center gap-4">
        <span class="text-lg"
          >Streak: <b class="text-2xl" style="color: var(--text)">{streak}</b
          ></span
        >
      </div>

      <div
        class="mx-auto flex h-[clamp(16rem,min(72vw,55vh),30rem)] w-[clamp(16rem,min(72vw,55vh),30rem)] items-center justify-center overflow-hidden rounded-3xl border"
        style="border-color: var(--border)"
      >
        <img
          src={artworkUrl(target.id)}
          alt={revealed ? formatName(target.name) : "Silhouette"}
          class="h-full w-full object-contain"
          style={revealed ? "" : "filter: brightness(0) contrast(1.05)"}
        />
      </div>

      {#if revealed}
        <h2
          class="mt-6 text-4xl font-black md:text-5xl"
          style="color: var(--text)"
        >
          {formatName(target.name)}
        </h2>
        <div class="mt-4 flex justify-center gap-2">
          <button
            onclick={newRound}
            class="bg-accent hover:bg-accent/80 cursor-pointer rounded-xl border-0 px-6 py-2.5 text-sm font-semibold text-white"
            >Next Pokémon</button
          >
        </div>
      {:else}
        <p class="mt-6 text-base" style="color: var(--muted)">
          Who's that Pokémon?
        </p>
        <div class="mx-auto mt-3 max-w-lg">
          <PokemonSearch
            bind:value={guess}
            options={catalog}
            onselect={onGuess}
            placeholder="Type your guess..."
          />
        </div>
        {#if hint}<p class="text-pokemon-red mt-2 text-xs">{hint}</p>{/if}
        <button
          onclick={skip}
          class="mt-4 cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60 hover:text-white"
          >Skip</button
        >
      {/if}
    </div>
  {/if}
</div>
