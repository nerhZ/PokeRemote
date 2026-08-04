<script lang="ts">
  import { onMount } from "svelte";
  import { getSpeciesIds, getPokemonDetail } from "$lib/api";
  import { getCatalog } from "$lib/url-state";
  import {
    artworkUrl,
    formatName,
    type PokemonDetail,
  } from "$lib/pokemon-types";
  import { getQuizStats, saveQuizStats } from "$lib/storage";
  import PokemonSearch from "$lib/components/PokemonSearch.svelte";
  import Pokeball from "$lib/components/Pokeball.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import Dropdown from "$lib/components/Dropdown.svelte";
  import TypeBadge from "$lib/components/TypeBadge.svelte";

  type Difficulty = "easy" | "normal" | "hard";

  let catalog = $state<{ name: string; id: number }[]>([]);
  let target = $state<{ name: string; id: number } | null>(null);
  let guess = $state("");
  let revealed = $state(false);
  let streak = $state(0);
  let hint = $state("");
  let loading = $state(true);
  let error = $state(false);
  let difficulty = $state<Difficulty>("normal");
  let stats = $state(getQuizStats());
  let letterHint = $state(false);
  let typeHint = $state(false);
  let targetDetail = $state<PokemonDetail | null>(null);
  let hintLoading = $state(false);
  let hintGen = 0;

  async function newRound() {
    revealed = false;
    hint = "";
    guess = "";
    letterHint = false;
    typeHint = false;
    targetDetail = null;
    try {
      const ids = await getSpeciesIds();
      const pool = difficulty === "easy" ? ids.filter((id) => id <= 386) : ids;
      const id = pool[Math.floor(Math.random() * pool.length)];
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

  function changeDifficulty(d: string) {
    difficulty = d as Difficulty;
    newRound();
  }

  async function revealType() {
    if (!target || typeHint || hintLoading) return;
    hintLoading = true;
    const gen = ++hintGen;
    try {
      const detail = await getPokemonDetail(target.name);
      if (gen === hintGen) targetDetail = detail;
      typeHint = true;
    } catch {
    } finally {
      if (gen === hintGen) hintLoading = false;
    }
  }

  function onGuess(name: string) {
    if (!target || revealed) return;
    if (name.toLowerCase() === target.name.toLowerCase()) {
      revealed = true;
      streak += 1;
      stats = {
        ...stats,
        correct: stats.correct + 1,
        best: Math.max(stats.best, streak),
        rounds: stats.rounds + 1,
      };
      saveQuizStats(stats);
    } else {
      hint = `Not ${formatName(name)} — try again!`;
      setTimeout(() => (hint = ""), 2500);
    }
  }

  function skip() {
    if (!target) return;
    revealed = true;
    streak = 0;
    stats = { ...stats, rounds: stats.rounds + 1 };
    saveQuizStats(stats);
  }
</script>

<div class="tool-shell max-w-5xl">
  <div class="tool-hero">
    <h1>Who's That Pokémon?</h1>
    <p>
      Guess the silhouette. Consecutive correct answers build your streak — pick
      a difficulty and use hints on the easier modes.
    </p>
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
      <div class="mb-5 flex flex-wrap items-center justify-center gap-4">
        <div class="w-52 text-left">
          <Dropdown
            selected={difficulty}
            onselect={changeDifficulty}
            options={[
              { value: "easy", label: "Easy", hint: "Gen I–III + hints" },
              { value: "normal", label: "Normal", hint: "All species + hints" },
              { value: "hard", label: "Hard", hint: "All species, no hints" },
            ]}
          />
        </div>
        <span class="text-lg"
          >Streak: <b class="text-2xl" style="color: var(--text)">{streak}</b
          ></span
        >
        <span class="text-sm text-white/40">Best: {stats.best}</span>
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
        {#if difficulty !== "hard"}
          <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              onclick={() => (letterHint = true)}
              disabled={letterHint}
              class="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >{letterHint
                ? "Letter: " + formatName(target.name)[0]
                : "Reveal letter"}</button
            >
            <button
              onclick={revealType}
              disabled={typeHint || hintLoading}
              class="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {hintLoading ? "…" : typeHint ? "Type revealed" : "Reveal type"}
            </button>
          </div>
          {#if typeHint && targetDetail}
            <div
              class="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-white/60"
            >
              <span>Type:</span>
              {#each targetDetail.types as t}
                <TypeBadge type={t} size="xs" />
              {/each}
            </div>
          {/if}
        {/if}
        <button
          onclick={skip}
          class="mt-4 cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60 hover:text-white"
          >Skip</button
        >
      {/if}
      <p class="mt-4 text-[10px] text-white/30">
        Lifetime: {stats.correct} correct across {stats.rounds} rounds
      </p>
    </div>
  {/if}
</div>
