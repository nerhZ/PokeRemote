<script lang="ts">
  import { onMount } from "svelte";
  import {
    getSpeciesIds,
    getPokemonDetail,
    getAutocompleteList,
  } from "$lib/api";
  import {
    artworkUrl,
    formatName,
    type PokemonDetail,
  } from "$lib/pokemon-types";
  import { getQuizStats, saveQuizStats } from "$lib/storage";
  import PokemonSearch from "$lib/components/PokemonSearch.svelte";
  import FitViewport from "$lib/components/FitViewport.svelte";
  import Pokeball from "$lib/components/Pokeball.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import Dropdown from "$lib/components/Dropdown.svelte";
  import TypeBadge from "$lib/components/TypeBadge.svelte";
  import * as stylex from "@stylexjs/stylex";
  import { shared } from "$lib/styles/shared.stylex";
  import { dynamic } from "../../lib/styles/dynamic.stylex";
  import { styles } from "./styles";

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
  let silHeight = $state(240);
  let heroRef: HTMLElement | undefined = $state();
  let fixedTopRef: HTMLElement | undefined = $state();
  let fixedBottomRef: HTMLElement | undefined = $state();

  async function newRound() {
    revealed = false;
    hint = "";
    guess = "";
    letterHint = false;
    typeHint = false;
    targetDetail = null;
    hintLoading = false;
    hintGen++;
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

  /** Size the silhouette to the available viewport space (via FitViewport). */
  function fitQuiz(pageH: number) {
    const hero = heroRef?.getBoundingClientRect().height ?? 0;
    const fixedTop = fixedTopRef?.getBoundingClientRect().height ?? 0;
    const fixedBottom = fixedBottomRef?.getBoundingClientRect().height ?? 0;
    // Shell padding (64) + hero margin (32) + panel padding (64 on md); the
    // silhouette takes whatever remains.
    const avail = pageH - 64 - 32 - 64 - hero - fixedTop - fixedBottom;
    // Envelope: min 10rem (small enough to fit short landscape phones),
    // max min(72vw, 55vh, 30rem).
    const cap = Math.min(
      window.innerWidth * 0.72,
      window.innerHeight * 0.55,
      480,
    );
    silHeight = Math.min(cap, Math.max(160, avail));
  }

  /** Safety shrink when the document still overflows (footer wrap, etc.). */
  function shrinkSilhouette(px: number) {
    silHeight = Math.max(160, silHeight - px);
  }

  let fitDeps = $derived([target, revealed, hint, typeHint, difficulty]);

  onMount(async () => {
    catalog = (await getAutocompleteList()).results;
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
      if (gen === hintGen) {
        targetDetail = detail;
        typeHint = true;
      }
    } catch {
      if (gen === hintGen) hint = "Couldn't load type info — try again.";
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

<FitViewport
  sx={[shared.toolShell, styles.shell]}
  deps={fitDeps}
  onMeasure={fitQuiz}
  onOverflow={shrinkSilhouette}
>
  <div {...stylex.attrs(shared.toolHero)} bind:this={heroRef}>
    <h1 {...stylex.attrs(shared.toolHeroTitle)}>Who's That Pokémon?</h1>
    <p {...stylex.attrs(shared.toolHeroText)}>
      Guess the silhouette. Consecutive correct answers build your streak — pick
      a difficulty and use hints on the easier modes.
    </p>
  </div>

  {#if loading}
    <div {...stylex.attrs(styles.loadingWrap)}>
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
    <div {...stylex.attrs(shared.panel, styles.panel)}>
      <div bind:this={fixedTopRef} {...stylex.attrs(styles.controls)}>
        <div {...stylex.attrs(styles.dropdownWrap)}>
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
        <span {...stylex.attrs(styles.streak)}
          >Streak: <b {...stylex.attrs(styles.streakValue)}>{streak}</b></span
        >
        <span {...stylex.attrs(styles.best)}>Best: {stats.best}</span>
      </div>

      <div {...stylex.attrs(styles.silhouetteWrap)}>
        <div
          {...stylex.attrs(
            styles.silhouetteBox,
            dynamic.height(`${silHeight}px`),
          )}
        >
          <img
            src={artworkUrl(target.id)}
            alt={revealed ? formatName(target.name) : "Silhouette"}
            {...stylex.attrs(
              styles.silhouette,
              revealed ? null : dynamic.filter("brightness(0) contrast(1.05)"),
            )}
          />
        </div>
      </div>

      <div bind:this={fixedBottomRef}>
        {#if revealed}
          <h2 {...stylex.attrs(styles.answer)}>
            {formatName(target.name)}
          </h2>
          <div {...stylex.attrs(styles.nextWrap)}>
            <button onclick={newRound} {...stylex.attrs(styles.nextButton)}
              >Next Pokémon</button
            >
          </div>
        {:else}
          <p {...stylex.attrs(styles.prompt)}>Who's that Pokémon?</p>
          <div {...stylex.attrs(styles.searchWrap)}>
            <PokemonSearch
              bind:value={guess}
              options={catalog}
              onselect={onGuess}
              placeholder="Type your guess..."
            />
          </div>
          {#if hint}<p {...stylex.attrs(styles.hint)}>{hint}</p>{/if}
          {#if difficulty !== "hard"}
            <div {...stylex.attrs(styles.hintRow)}>
              <button
                onclick={() => (letterHint = true)}
                disabled={letterHint}
                {...stylex.attrs(styles.hintButton)}
                >{letterHint
                  ? "Letter: " + formatName(target.name)[0]
                  : "Reveal letter"}</button
              >
              <button
                onclick={revealType}
                disabled={typeHint || hintLoading}
                {...stylex.attrs(styles.hintButton)}
              >
                {hintLoading ? "…" : typeHint ? "Type revealed" : "Reveal type"}
              </button>
            </div>
            {#if typeHint && targetDetail}
              <div {...stylex.attrs(styles.typeHintRow)}>
                <span>Type:</span>
                {#each targetDetail.types as t}
                  <TypeBadge type={t} size="xs" />
                {/each}
              </div>
            {/if}
          {/if}
          <button onclick={skip} {...stylex.attrs(styles.skipButton)}
            >Skip</button
          >
        {/if}
        <p {...stylex.attrs(styles.lifetime)}>
          Lifetime: {stats.correct} correct across {stats.rounds} rounds
        </p>
      </div>
    </div>
  {/if}
</FitViewport>
