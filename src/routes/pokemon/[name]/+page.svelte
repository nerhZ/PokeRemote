<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { getPokemonDetail, getPokemonMoves, getSpeciesIds } from "$lib/api";
  import {
    TYPE_COLORS,
    formLabel,
    formatName,
    formatId,
    STAT_LABELS,
    statTotal,
    type PokemonDetail,
    type PokemonMoves,
  } from "$lib/pokemon-types";
  import {
    pushRecent,
    toggleFavorite,
    isFavorite,
    getSavedTeams,
  } from "$lib/storage";
  import { backTarget } from "$lib/navigation";
  import { pageLoading } from "$lib/loading-state.svelte";
  import TypeBadge from "$lib/components/TypeBadge.svelte";
  import PokemonImage from "$lib/components/PokemonImage.svelte";
  import MoveTooltip from "$lib/components/MoveTooltip.svelte";
  import Pokeball from "$lib/components/Pokeball.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import RadarChart from "$lib/components/RadarChart.svelte";
  import StatBars from "$lib/components/StatBars.svelte";
  import TypeMatchup from "$lib/components/TypeMatchup.svelte";
  import EvolutionChain from "$lib/components/EvolutionChain.svelte";
  import TabBar from "$lib/components/TabBar.svelte";
  import { untrack } from "svelte";

  let pokemon = $state<PokemonDetail | null>(null);
  let moves = $state<PokemonMoves | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let isShiny = $state(false);
  let animated = $state(false);
  let movesLoading = $state(false);
  let activeMoveTab = $state("level_up");
  let tab = $state<"overview" | "stats" | "matchups" | "moves" | "data">(
    "overview",
  );
  let fav = $state(false);
  let requestId = 0;
  let moveGen = 0;
  let speciesIds = $state<number[]>([]);

  $effect(() => {
    const name = page.params.name;
    if (!name) return;
    loading = untrack(() => pokemon === null);
    error = null;
    moves = null;
    movesLoading = false;
    moveGen++;
    back = backTarget(localStorage.getItem("previousUrl"));
    isShiny = false;
    animated = false;
    pageLoading.active = true;
    const id = ++requestId;
    getSpeciesIds().then((ids) => {
      speciesIds = ids;
    });
    getPokemonDetail(name)
      .then((p) => {
        if (id !== requestId) return;
        pokemon = p;
        if (p) {
          fav = isFavorite(p.id);
          pushRecent({
            id: p.id,
            name: p.name,
            image: p.sprites.other["official-artwork"].front_default,
          });
          if (tab === "moves") loadMoves();
        }
      })
      .catch((e: any) => {
        if (id === requestId) {
          error = e.message;
        }
      })
      .finally(() => {
        if (id === requestId) {
          loading = false;
          pageLoading.active = false;
        }
      });
  });

  async function loadMoves() {
    if (moves || movesLoading) return;
    const name = page.params.name;
    if (!name) return;
    movesLoading = true;
    const gen = ++moveGen;
    try {
      const m = await getPokemonMoves(name);
      if (gen !== moveGen) return;
      if (
        (!m || m.level_up.length === 0) &&
        pokemon &&
        pokemon.name !== pokemon.species_name
      ) {
        const fallback = await getPokemonMoves(pokemon.species_name);
        if (gen !== moveGen) return;
        moves = fallback;
      } else {
        moves = m;
      }
    } catch {
    } finally {
      if (gen === moveGen) movesLoading = false;
    }
  }

  let prevId = $derived(
    speciesIds.length > 0 && pokemon
      ? (() => {
          const idx = speciesIds.indexOf(pokemon.species_id);
          if (idx < 0) return null;
          return speciesIds[(idx - 1 + speciesIds.length) % speciesIds.length];
        })()
      : null,
  );
  let nextId = $derived(
    speciesIds.length > 0 && pokemon
      ? (() => {
          const idx = speciesIds.indexOf(pokemon.species_id);
          if (idx < 0) return null;
          return speciesIds[(idx + 1) % speciesIds.length];
        })()
      : null,
  );
  let primaryType = $derived(pokemon?.types[0] ?? "normal");
  let primaryColor = $derived(TYPE_COLORS[primaryType] || "#777");
  let totalStats = $derived(pokemon ? statTotal(pokemon.stats) : 0);

  let animatedFront = $derived(
    pokemon?.sprites.versions?.["generation-v"]?.["black-white"]?.animated
      ?.front_default ?? null,
  );

  let spriteUrl = $derived(
    animated
      ? animatedFront
      : pokemon?.sprites.other["official-artwork"][
          isShiny ? "front_shiny" : "front_default"
        ],
  );

  let teamParam = $derived.by(() => {
    if (!pokemon) return "";
    const p = pokemon;
    return [
      ...(getSavedTeams()[0]?.names ?? []).filter((n) => n !== p.name),
      p.name,
    ]
      .slice(-6)
      .join(",");
  });

  function onFav() {
    if (!pokemon) return;
    toggleFavorite({
      id: pokemon.id,
      name: pokemon.name,
      image: pokemon.sprites.other["official-artwork"].front_default,
      types: pokemon.types,
    });
    fav = !fav;
  }

  let linkCopied = $state(false);
  function copyLink() {
    navigator.clipboard?.writeText(window.location.href);
    linkCopied = true;
    setTimeout(() => (linkCopied = false), 2000);
  }

  async function setTab(t: typeof tab) {
    tab = t;
    if (t === "moves") await loadMoves();
  }

  let genderInfo = $derived.by(() => {
    if (pokemon?.gender_rate === null || pokemon?.gender_rate === undefined)
      return null;
    if (pokemon.gender_rate === -1) return "Genderless";
    const female = (pokemon.gender_rate / 8) * 100;
    return `${100 - female}% ♂ / ${female}% ♀`;
  });

  let moveTabCounts = $derived({
    level_up: moves?.level_up?.length ?? 0,
    machine: moves?.machine?.length ?? 0,
    egg: moves?.egg?.length ?? 0,
    tutor: moves?.tutor?.length ?? 0,
  });

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "stats" as const, label: "Stats" },
    { id: "matchups" as const, label: "Matchups" },
    { id: "moves" as const, label: "Moves" },
    { id: "data" as const, label: "Data" },
  ];

  let back = $state<{ url: string; label: string }>({
    url: resolve("/"),
    label: "Pokédex",
  });
</script>

<div
  class="relative min-h-[calc(100vh-73px)]"
  style="background: linear-gradient(180deg, {primaryColor}18 0%, transparent 55%)"
>
  <div class="relative mx-auto max-w-6xl px-4 py-6 md:px-6">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <a
        href={back.url}
        class="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/60 no-underline transition-all hover:text-white"
        >← {back.label}</a
      >
      {#if pokemon}
        <div class="flex items-center gap-2">
          {#if prevId != null}
            <a
              href={resolve(`/pokemon/${prevId}`)}
              class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 no-underline hover:text-white"
              aria-label="Previous species">‹</a
            >
          {/if}
          {#if nextId != null}
            <a
              href={resolve(`/pokemon/${nextId}`)}
              class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 no-underline hover:text-white"
              aria-label="Next species">›</a
            >
          {/if}
        </div>
      {/if}
    </div>

    {#if loading && !pokemon}
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.3fr]">
        <div class="aspect-square animate-pulse rounded-3xl bg-white/3"></div>
        <div class="space-y-4">
          <div class="h-64 animate-pulse rounded-3xl bg-white/3"></div>
          <div class="h-40 animate-pulse rounded-3xl bg-white/3"></div>
        </div>
      </div>
    {:else if error && !pokemon}
      <EmptyState
        title="Something went wrong"
        subtitle={error}
        actionLabel="Back to Pokédex"
        onaction={() => goto(resolve("/"))}
      />
    {:else if pokemon}
      <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_1.35fr]">
        <div class="lg:sticky lg:top-24">
          <div
            class="relative overflow-hidden rounded-3xl border border-white/6"
            style="background: linear-gradient(180deg, {primaryColor}12 0%, transparent 70%)"
          >
            <div
              class="relative flex aspect-square items-center justify-center p-8"
            >
              <div
                class="absolute h-56 w-56 rounded-full opacity-15"
                style="background: radial-gradient(circle, {primaryColor}, transparent 70%)"
              ></div>
              <PokemonImage
                src={spriteUrl ?? ""}
                alt={pokemon.name}
                lazy={false}
                class="relative z-10 w-full max-w-80 object-contain drop-shadow-2xl"
                style="animation: bob 3s ease-in-out infinite"
              />
            </div>
            <div class="absolute top-4 left-4 flex flex-wrap gap-1.5">
              {#if pokemon.sprites.other["official-artwork"].front_shiny && !animated}
                <button
                  onclick={() => (isShiny = !isShiny)}
                  class="cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-black uppercase {isShiny
                    ? 'text-bg-navy border-white bg-white'
                    : 'border-white/10 bg-black/40 text-white/60'}"
                  >{isShiny ? "★ Shiny" : "☆ Shiny"}</button
                >
              {/if}
              {#if animatedFront}
                <button
                  onclick={() => (animated = !animated)}
                  class="cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-black uppercase {animated
                    ? 'text-bg-navy border-white bg-white'
                    : 'border-white/10 bg-black/40 text-white/60'}"
                  >{animated ? "■ Static" : "▶ Animated"}</button
                >
              {/if}
              {#if pokemon.cries}
                <button
                  onclick={() => {
                    const a = new Audio(pokemon!.cries!);
                    a.volume = 0.4;
                    a.play();
                  }}
                  class="cursor-pointer rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-black text-white/60 uppercase"
                  aria-label="Play cry">🔊 Cry</button
                >
              {/if}
              <button
                onclick={onFav}
                class="cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-black uppercase {fav
                  ? 'bg-pokemon-yellow/20 border-pokemon-yellow/40 text-pokemon-yellow'
                  : 'border-white/10 bg-black/40 text-white/60'}"
                >{fav ? "★ Saved" : "☆ Save"}</button
              >
              <a
                href={resolve("/compare") + `?a=${pokemon.name}`}
                class="cursor-pointer rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-black text-white/60 uppercase no-underline transition-colors hover:text-white"
                >⇄ Compare</a
              >
              <a
                href={resolve("/team-builder") + `?p=${teamParam}`}
                class="cursor-pointer rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-black text-white/60 uppercase no-underline transition-colors hover:text-white"
                >⬡ Team</a
              >
              <button
                onclick={copyLink}
                class="cursor-pointer rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-black text-white/60 uppercase transition-colors hover:text-white"
                >{linkCopied ? "Link copied!" : "🔗 Share"}</button
              >
            </div>
            <div class="absolute top-4 right-4 flex flex-col gap-1.5">
              {#if pokemon.is_legendary}<span
                  class="from-pokemon-yellow to-pokemon-gold rounded-full bg-linear-to-r px-3 py-1 text-[10px] font-black text-white uppercase"
                  >Legendary</span
                >{/if}
              {#if pokemon.is_mythical}<span
                  class="rounded-full bg-linear-to-r from-pink-500 to-purple-500 px-3 py-1 text-[10px] font-black text-white uppercase"
                  >Mythical</span
                >{/if}
            </div>
          </div>

          <div class="mt-5 text-center">
            <span
              class="text-sm font-bold tracking-wider"
              style="color: {primaryColor}">{formatId(pokemon.species_id)}</span
            >
            {#if pokemon.id !== pokemon.species_id}
              <span class="ml-1.5 text-xs" style="color: var(--muted)"
                >form #{pokemon.id}</span
              >
            {/if}
            {#if pokemon.genus}<span
                class="ml-2 text-sm"
                style="color: var(--muted)">{pokemon.genus}</span
              >{/if}
            <h1
              class="mt-1 text-4xl font-black md:text-5xl"
              style="color: var(--text)"
            >
              {formatName(pokemon.name)}
            </h1>
            {#if pokemon.name !== pokemon.species_name}
              <p class="mt-1 text-xs" style="color: var(--muted)">
                {formLabel(pokemon.name, pokemon.species_name)} form of {formatName(
                  pokemon.species_name,
                )}
              </p>
            {/if}
            <div class="mt-3 flex flex-wrap justify-center gap-2">
              {#each pokemon.types as type}
                <a
                  href={resolve("/") + `?type=${type}`}
                  class="no-underline"
                  title={`Show ${formatName(type)}-type Pokémon`}
                  ><TypeBadge {type} size="md" /></a
                >
              {/each}
            </div>
            {#if pokemon.flavor_text}
              <p
                class="mt-4 text-sm leading-relaxed italic"
                style="color: var(--muted)"
              >
                "{pokemon.flavor_text}"
              </p>
            {/if}
          </div>

          <div class="panel mt-5 grid grid-cols-2 gap-2 p-3!">
            <div class="py-2 text-center">
              <div class="text-lg font-bold">{pokemon.height / 10}m</div>
              <div class="text-[10px] tracking-wider text-white/40 uppercase">
                Height
              </div>
            </div>
            <div class="border-l border-white/6 py-2 text-center">
              <div class="text-lg font-bold">{pokemon.weight / 10}kg</div>
              <div class="text-[10px] tracking-wider text-white/40 uppercase">
                Weight
              </div>
            </div>
            <div class="border-t border-white/6 py-2 text-center">
              <div class="text-lg font-bold">{pokemon.base_experience}</div>
              <div class="text-[10px] tracking-wider text-white/40 uppercase">
                Base Exp
              </div>
            </div>
            <div class="border-t border-l border-white/6 py-2 text-center">
              <div class="text-lg font-bold">{pokemon.moves_count}</div>
              <div class="text-[10px] tracking-wider text-white/40 uppercase">
                Moves
              </div>
            </div>
          </div>

          {#if pokemon.forms?.length > 1}
            <div class="panel mt-3 max-w-full overflow-hidden p-3!">
              <h3
                class="mb-2 text-[10px] font-bold tracking-wider uppercase"
                style="color: var(--muted)"
              >
                Forms ({pokemon.forms.length})
              </h3>
              <div class="flex flex-wrap gap-2">
                {#each pokemon.forms as form}
                  <a
                    href={resolve(`/pokemon/${form.name}`)}
                    class="flex w-16 flex-col items-center gap-1 rounded-xl border p-1.5 no-underline transition-all {form.name ===
                    pokemon.name
                      ? 'border-accent bg-accent/10'
                      : 'border-white/10 hover:border-white/25'}"
                    style="color: var(--text)"
                    title={form.name}
                  >
                    <PokemonImage
                      src={form.image}
                      alt={form.name}
                      lazy={false}
                      class="h-12 w-12 object-contain"
                    />
                    <span
                      class="line-clamp-2 text-center text-[9px] leading-tight font-semibold"
                      >{formLabel(form.name, pokemon.species_name)}</span
                    >
                  </a>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <div class="pb-12">
          <TabBar
            {tabs}
            active={tab}
            color={primaryColor}
            onchange={(id) => setTab(id as typeof tab)}
          />

          {#if tab === "overview"}
            <div class="space-y-5">
              <div class="panel">
                <h2 class="mb-4 text-lg font-bold">Abilities</h2>
                <div class="space-y-3">
                  {#each pokemon.abilities as ability}
                    <div
                      class="rounded-xl border p-3"
                      style="background-color: {primaryColor}10; border-color: {primaryColor}25"
                    >
                      <div class="mb-1 flex items-center gap-2">
                        <span class="text-sm font-bold"
                          >{formatName(ability.name)}</span
                        >
                        {#if ability.is_hidden}<span
                            class="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/50 uppercase"
                            >Hidden</span
                          >{/if}
                      </div>
                      {#if ability.description}<p
                          class="text-xs leading-relaxed text-white/50"
                        >
                          {ability.description}
                        </p>{/if}
                    </div>
                  {/each}
                </div>
              </div>

              {#if pokemon.evolution?.children?.length}
                <div class="panel">
                  <h2 class="mb-4 text-lg font-bold">Evolution Chain</h2>
                  <EvolutionChain
                    stage={pokemon.evolution}
                    currentName={pokemon.name}
                    color={primaryColor}
                  />
                </div>
              {/if}

              {#if pokemon.locations?.length}
                <div class="panel">
                  <h2 class="mb-4 text-lg font-bold">Locations</h2>
                  <div class="grid gap-2 sm:grid-cols-2">
                    {#each pokemon.locations as loc}
                      <div
                        class="rounded-xl border border-white/4 bg-white/2 px-3 py-2 text-xs"
                      >
                        <div class="font-semibold text-white/80 capitalize">
                          {loc.area}
                        </div>
                        <div class="mt-0.5 text-white/40 capitalize">
                          {loc.method}{loc.chance != null
                            ? ` · ${loc.chance}%`
                            : ""}
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {:else if tab === "stats"}
            <div class="panel">
              <div class="mb-5 flex items-center justify-between">
                <h2 class="text-lg font-bold">Base Stats</h2>
                <div
                  class="flex h-11 w-11 items-center justify-center rounded-full text-sm font-black"
                  style="background-color: {primaryColor}22; color: {primaryColor}"
                >
                  {totalStats}
                </div>
              </div>
              <div class="flex flex-col items-center gap-6">
                <div class="mx-auto w-full max-w-sm">
                  <RadarChart {pokemon} color={primaryColor} />
                </div>
                <div class="w-full max-w-md">
                  <StatBars {pokemon} color={primaryColor} />
                </div>
              </div>
            </div>
          {:else if tab === "matchups"}
            <div class="panel">
              <h2 class="mb-5 text-lg font-bold">Type Effectiveness</h2>
              <TypeMatchup effectiveness={pokemon.type_effectiveness} />
            </div>
          {:else if tab === "moves"}
            <div class="panel">
              <h2 class="mb-4 text-lg font-bold">Moves</h2>
              {#if movesLoading}
                <div class="flex justify-center py-10">
                  <Pokeball spinning class="h-8 w-8" />
                </div>
              {:else if moves}
                <div class="mb-4 flex flex-wrap gap-2">
                  {#each ["level_up", "machine", "egg", "tutor"] as t}
                    {#if moveTabCounts[t as keyof typeof moveTabCounts] > 0}
                      <button
                        onclick={() => (activeMoveTab = t)}
                        class="cursor-pointer rounded-lg border-0 px-3 py-1.5 text-xs font-bold uppercase {activeMoveTab ===
                        t
                          ? 'text-white'
                          : 'bg-white/5 text-white/40'}"
                        style={activeMoveTab === t
                          ? `background-color: ${primaryColor}33`
                          : ""}
                      >
                        {t === "level_up"
                          ? "Level"
                          : t === "machine"
                            ? "TM"
                            : t === "egg"
                              ? "Egg"
                              : "Tutor"} ({moveTabCounts[
                          t as keyof typeof moveTabCounts
                        ]})
                      </button>
                    {/if}
                  {/each}
                </div>
                {#if activeMoveTab === "level_up" || activeMoveTab === "machine" || activeMoveTab === "egg" || activeMoveTab === "tutor"}
                  <div class="grid gap-2 sm:grid-cols-2">
                    {#each moves[activeMoveTab as keyof PokemonMoves] as m}
                      <MoveTooltip move={m}>
                        {#snippet children()}
                          <div
                            class="flex items-center gap-2 rounded-xl border border-white/4 bg-white/2 px-3 py-2 text-sm"
                          >
                            {#if activeMoveTab === "level_up"}
                              <span
                                class="w-8 text-right text-[11px] font-black text-white/50"
                                >{m.level}</span
                              >
                            {/if}
                            <TypeBadge
                              type={m.type}
                              size="xs"
                              tooltip={false}
                            />
                            <span
                              class="flex-1 truncate font-semibold text-white/80"
                              >{formatName(m.name)}</span
                            >
                            <span class="text-[10px] text-white/30">
                              {m.power ?? "—"}/{m.accuracy ?? "—"}/{m.pp ?? "—"}
                            </span>
                          </div>
                        {/snippet}
                      </MoveTooltip>
                    {/each}
                  </div>
                {/if}
              {/if}
            </div>
          {:else if tab === "data"}
            <div class="panel">
              <h2 class="mb-5 text-lg font-bold">Pokédex Data</h2>
              <div class="grid grid-cols-2 gap-4 md:grid-cols-3">
                {#if pokemon.capture_rate != null}<div>
                    <div
                      class="text-[10px] tracking-wider text-white/40 uppercase"
                    >
                      Catch Rate
                    </div>
                    <div class="font-bold">{pokemon.capture_rate}/255</div>
                  </div>{/if}
                {#if pokemon.base_happiness != null}<div>
                    <div
                      class="text-[10px] tracking-wider text-white/40 uppercase"
                    >
                      Happiness
                    </div>
                    <div class="font-bold">{pokemon.base_happiness}</div>
                  </div>{/if}
                {#if pokemon.growth_rate}<div>
                    <div
                      class="text-[10px] tracking-wider text-white/40 uppercase"
                    >
                      Growth
                    </div>
                    <div class="font-bold capitalize">
                      {pokemon.growth_rate.replace(/-/g, " ")}
                    </div>
                  </div>{/if}
                {#if pokemon.habitat}<div>
                    <div
                      class="text-[10px] tracking-wider text-white/40 uppercase"
                    >
                      Habitat
                    </div>
                    <div class="font-bold capitalize">{pokemon.habitat}</div>
                  </div>{/if}
                {#if pokemon.color}<div>
                    <div
                      class="text-[10px] tracking-wider text-white/40 uppercase"
                    >
                      Color
                    </div>
                    <div class="font-bold capitalize">{pokemon.color}</div>
                  </div>{/if}
                {#if pokemon.shape}<div>
                    <div
                      class="text-[10px] tracking-wider text-white/40 uppercase"
                    >
                      Shape
                    </div>
                    <div class="font-bold capitalize">{pokemon.shape}</div>
                  </div>{/if}
                {#if pokemon.egg_groups.length}<div>
                    <div
                      class="text-[10px] tracking-wider text-white/40 uppercase"
                    >
                      Egg Groups
                    </div>
                    <div class="font-bold capitalize">
                      {pokemon.egg_groups
                        .map((g) => g.replace(/-/g, " "))
                        .join(", ")}
                    </div>
                  </div>{/if}
                {#if genderInfo}<div>
                    <div
                      class="text-[10px] tracking-wider text-white/40 uppercase"
                    >
                      Gender
                    </div>
                    <div class="font-bold">{genderInfo}</div>
                  </div>{/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
