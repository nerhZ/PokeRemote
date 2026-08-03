<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { getPokemonDetail, getPokemonMetadata } from "$lib/api";
  import { getCatalog, pageUrlSync, selectPokemonSlot } from "$lib/url-state";
  import {
    TYPE_COLORS,
    ALL_TYPES,
    TYPE_CHART,
    NATURES,
    NATURES_MODIFIERS,
    formatName,
    type PokemonDetail,
  } from "$lib/pokemon-types";
  import {
    saveTeam,
    getSavedTeams,
    EV_STATS,
    zeroEvs,
    evTotal,
    type EvSpread,
  } from "$lib/storage";
  import PokemonSearch from "$lib/components/PokemonSearch.svelte";
  import TypeBadge from "$lib/components/TypeBadge.svelte";
  import MoveTooltip from "$lib/components/MoveTooltip.svelte";
  import Tooltip from "$lib/components/Tooltip.svelte";
  import Dropdown from "$lib/components/Dropdown.svelte";
  import TypePopup from "$lib/components/TypePopup.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import { onMount } from "svelte";

  let allNames: { name: string; id: number }[] = $state([]);
  let search = $state("");
  let team: PokemonDetail[] = $state([]);
  let loading = $state(false);
  let teamName = $state("My Team");
  let saved = $state<ReturnType<typeof getSavedTeams>>([]);
  let copied = $state(false);

  let editingIndex = $state<number | null>(null);
  let editLoading = $state(false);
  let loadingTeam = $state(false);
  type MoveOption = {
    name: string;
    type: string;
    power: number | null;
    accuracy: number | null;
    pp: number | null;
    effect: string | null;
  };
  type AbilityOption = { name: string; description: string | null };

  let moveOptions = $state<MoveOption[]>([]);
  let abilityOptions = $state<AbilityOption[]>([]);
  let metaCache = $state<
    Record<string, { moves: MoveOption[]; abilities: AbilityOption[] }>
  >({});
  let moveDropdowns = $state<Record<string, boolean>>({});
  let abilityDropdowns = $state<Record<string, boolean>>({});
  let natureDropdowns = $state<Record<string, boolean>>({});
  let sets = $state<
    { moves: string[]; ability: string; nature: string; evs: EvSpread }[]
  >([]);
  let evWarning = $state("");

  const sync = pageUrlSync("/team-builder");

  onMount(async () => {
    saved = getSavedTeams();
    allNames = (await getCatalog()).results;
  });

  function initSet() {
    return { moves: ["", "", "", ""], ability: "", nature: "", evs: zeroEvs() };
  }

  function abilityTooltip(pokemonName: string, abilityName: string) {
    const a = metaCache[pokemonName]?.abilities.find(
      (o) => o.name === abilityName,
    );
    return a?.description ?? "";
  }

  function clearState() {
    sync.clear();
    team = [];
    sets = [];
    search = "";
    editingIndex = null;
    teamName = "My Team";
    moveDropdowns = {};
    abilityDropdowns = {};
    natureDropdowns = {};
    evWarning = "";
  }

  function setEv(stat: keyof EvSpread, val: number) {
    if (editingIndex == null) return;
    const i = editingIndex;
    const s = sets[i] ?? initSet();
    const clamped = Math.max(0, Math.min(252, val));
    const otherTotal = evTotal(s.evs) - s.evs[stat];
    const maxForStat = Math.min(252, 510 - otherTotal);
    const finalValue = Math.min(clamped, maxForStat);
    const evs = { ...s.evs, [stat]: finalValue };
    if (finalValue !== clamped) {
      evWarning = `Total EVs cannot exceed 510`;
    } else {
      evWarning = "";
    }
    sets = sets.map((set, idx) => (idx === i ? { ...set, evs } : set));
  }

  async function editPokemon(i: number) {
    evWarning = "";
    if (editingIndex === i) {
      editingIndex = null;
      return;
    }
    editingIndex = i;
    const p = team[i];
    while (sets.length <= i) sets = [...sets, initSet()];
    if (metaCache[p.name]) {
      moveOptions = metaCache[p.name].moves;
      abilityOptions = metaCache[p.name].abilities;
      return;
    }
    editLoading = true;
    try {
      const meta = await getPokemonMetadata(p.name);
      metaCache[p.name] = { moves: meta.moves, abilities: meta.abilities };
      moveOptions = meta.moves;
      abilityOptions = meta.abilities;
    } catch {
    } finally {
      editLoading = false;
    }
  }

  function pickMove(slot: number, name: string) {
    if (editingIndex == null) return;
    const i = editingIndex;
    sets = sets.map((set, idx) =>
      idx === i
        ? { ...set, moves: set.moves.map((m, j) => (j === slot ? name : m)) }
        : set,
    );
    const key = `${i}-${slot}`;
    moveDropdowns = { ...moveDropdowns, [key]: false };
  }

  function pickAbility(name: string) {
    if (editingIndex == null) return;
    sets = sets.map((set, idx) =>
      idx === editingIndex ? { ...set, ability: name } : set,
    );
    abilityDropdowns = {};
  }

  function pickNature(name: string) {
    if (editingIndex == null) return;
    sets = sets.map((set, idx) =>
      idx === editingIndex ? { ...set, nature: name } : set,
    );
    natureDropdowns = {};
  }

  function saveSet() {
    editingIndex = null;
    syncUrl();
  }

  async function loadTeamFromUrl() {
    const p = page.url.searchParams.get("p");
    if (!p) return;
    const names = p.split(",").filter(Boolean).slice(0, 6);
    const currentNames = new Set(team.map((t) => t.name));
    if (names.every((n) => currentNames.has(n))) return;
    const rawSets = page.url.searchParams.get("s");
    const decoded = rawSets ? decodeSets(rawSets) : [];
    loadingTeam = true;
    try {
      for (const n of names) {
        if (team.some((t) => t.name === n)) continue;
        try {
          const d = await getPokemonDetail(n);
          if (!team.some((t) => t.id === d.id)) {
            team = [...team, d];
            while (sets.length < team.length) sets = [...sets, initSet()];
          }
        } catch {}
        if (!metaCache[n]) {
          try {
            const meta = await getPokemonMetadata(n);
            metaCache[n] = { moves: meta.moves, abilities: meta.abilities };
          } catch {}
        }
      }
      while (sets.length < decoded.length)
        sets = [
          ...sets,
          ...decoded.slice(sets.length).map((d) => ({ ...initSet(), ...d })),
        ];
      for (let i = 0; i < Math.min(sets.length, decoded.length); i++) {
        if (decoded[i])
          sets = sets.map((s, idx) =>
            idx === i ? { ...s, ...decoded[i] } : s,
          );
      }
    } finally {
      loadingTeam = false;
    }
  }

  $effect(() => {
    if (loadingTeam) return;
    loadTeamFromUrl();
  });

  function evsEncode(evs: EvSpread) {
    const v = EV_STATS.map((s) => evs[s.key]);
    return v.every((x) => x === 0) ? "0" : v.join(".");
  }

  function evsDecode(raw: string): EvSpread {
    const v = raw.split(".").map(Number);
    const evs = zeroEvs();
    EV_STATS.forEach((s, i) => {
      evs[s.key] = v[i] || 0;
    });
    return evs;
  }

  function encodeSets() {
    return sets
      .slice(0, team.length)
      .map((s) => {
        const parts = [
          s.moves.join("|"),
          s.ability || "_",
          s.nature || "_",
          evsEncode(s.evs),
        ];
        return parts.join("~");
      })
      .join(",");
  }

  function padMoves(moves: string[]) {
    const p = moves.slice(0, 4);
    while (p.length < 4) p.push("");
    return p;
  }

  function decodeSets(raw: string) {
    const parts = raw.split(",");
    const decoded: {
      moves: string[];
      ability: string;
      nature: string;
      evs: EvSpread;
    }[] = [];
    for (const part of parts) {
      const [movesRaw, ability, nature, evsRaw] = part.split("~");
      decoded.push({
        moves: padMoves((movesRaw || "").split("|").slice(0, 4)),
        ability: ability === "_" ? "" : ability,
        nature: nature === "_" ? "" : nature,
        evs: evsDecode(evsRaw || "0"),
      });
    }
    return decoded;
  }

  function hasSets() {
    return sets.some(
      (s) =>
        s.moves.some((m) => m) || s.ability || s.nature || evTotal(s.evs) > 0,
    );
  }

  function syncUrl() {
    const params = new URLSearchParams();
    if (team.length) params.set("p", team.map((t) => t.name).join(","));
    if (hasSets()) {
      params.set("s", encodeSets());
    }
    sync.push(params);
  }

  async function addToTeam(name: string) {
    if (team.length >= 6) return;
    search = "";
    await selectPokemonSlot(name, {
      setLoading: (v) => (loading = v),
      apply: (detail) => {
        if (!team.some((t) => t.id === detail.id)) {
          team = [...team, detail];
          sets = [...sets, initSet()];
          syncUrl();
        }
      },
    });
  }

  function removeFromTeam(id: number) {
    const idx = team.findIndex((p) => p.id === id);
    team = team.filter((p) => p.id !== id);
    sets = sets.filter((_, i) => i !== idx);
    if (editingIndex === idx) editingIndex = null;
    syncUrl();
  }

  function exportTeam() {
    saved = saveTeam(
      teamName || "My Team",
      team,
      sets.map((s) => s.moves),
      sets.map((s) => s.ability),
      sets.map((s) => s.nature),
      sets.map((s) => s.evs),
    );
    syncUrl();
    const url = new URL(resolve("/team-builder"), window.location.origin);
    url.searchParams.set("p", team.map((t) => t.name).join(","));
    if (hasSets()) {
      url.searchParams.set("s", encodeSets());
    }
    navigator.clipboard?.writeText(url.toString());
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

  let teamHasMoves = $derived(
    team.some((_p, i) => (sets[i]?.moves ?? []).some(Boolean)),
  );

  /** Best type-effectiveness multiplier of the team's chosen moves per defending type. */
  let offense = $derived.by(() => {
    const best: Record<string, number> = {};
    for (const t of ALL_TYPES) best[t] = 0;
    for (let i = 0; i < team.length; i++) {
      const meta = metaCache[team[i].name];
      const set = sets[i];
      if (!meta || !set) continue;
      for (const moveName of set.moves.filter(Boolean)) {
        const m = meta.moves.find((o) => o.name === moveName);
        if (!m) continue;
        const chart = TYPE_CHART[m.type];
        if (!chart) continue;
        for (const [defType, mult] of Object.entries(chart)) {
          if (mult > best[defType]) best[defType] = mult;
        }
      }
    }
    return best;
  });
  let teamStrong = $derived(ALL_TYPES.filter((t) => offense[t] >= 2));
  let teamBlind = $derived(
    teamHasMoves ? ALL_TYPES.filter((t) => offense[t] < 1) : [],
  );

  function hoverTitle(i: number) {
    const s = sets[i];
    if (!s) return "";
    const parts: string[] = [];
    if (s.moves.some((m) => m))
      parts.push(
        s.moves
          .filter((m) => m)
          .map((m) => formatName(m))
          .join(" / "),
      );
    if (s.ability) parts.push("Ability: " + formatName(s.ability));
    if (s.nature) parts.push(s.nature + " nature");
    const evs = s.evs;
    if (evs && evTotal(evs) > 0) {
      parts.push(
        `EVs: ${evs.hp}/${evs.atk}/${evs.def}/${evs.spa}/${evs.spd}/${evs.spe}`,
      );
    }
    return parts.join("\n");
  }
</script>

<div class="tool-shell">
  <div class="tool-hero">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1>Team Builder</h1>
        <p>Six slots, movesets, share with competitive setups.</p>
      </div>
      {#if page.url.search}
        <button
          onclick={clearState}
          class="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 hover:text-white"
        >
          Clear
        </button>
      {/if}
    </div>
  </div>

  <div class="panel mb-6 max-w-xl p-4!">
    <PokemonSearch
      bind:value={search}
      options={allNames.filter((n) => !team.some((t) => t.id === n.id))}
      disabled={team.length >= 6}
      placeholder={team.length >= 6 ? "Team is full" : "Add a Pokémon..."}
      onselect={addToTeam}
    />
    {#if loading}<div class="mt-2"><LoadingSpinner size="sm" /></div>{/if}
  </div>

  <div class="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
    {#each Array(6) as _, i}
      {#if team[i]}
        {@const p = team[i]}
        {@const color = TYPE_COLORS[p.types[0]] || "#777"}
        {@const hasSet =
          sets[i] &&
          (sets[i].moves.some((m) => m) ||
            sets[i].ability ||
            sets[i].nature ||
            (sets[i].evs && evTotal(sets[i].evs) > 0))}
        <div
          class="panel relative cursor-pointer p-3! text-center transition-all hover:-translate-y-1"
          style="box-shadow: inset 0 0 0 1px {color}40"
          onclick={() => editPokemon(i)}
          role="button"
          tabindex="0"
          onkeydown={(e) => {
            if (e.key === "Enter") editPokemon(i);
          }}
          title={hoverTitle(i)}
        >
          <div class="absolute top-1.5 left-1.5 z-10 flex gap-1">
            <a
              href={resolve(`/pokemon/${p.name}`)}
              onclick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goto(resolve(`/pokemon/${p.name}`));
              }}
              class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-black/20 text-xs text-white/50 no-underline hover:text-white"
              title="Open Pokédex">◉</a
            >
          </div>
          <button
            onclick={(e) => {
              e.stopPropagation();
              removeFromTeam(p.id);
            }}
            class="bg-pokemon-red/20 text-pokemon-red hover:bg-pokemon-red/40 absolute top-1.5 right-1.5 z-10 h-6 w-6 cursor-pointer rounded-md border-0 text-xs font-bold transition-colors"
            >×</button
          >
          <img
            src={p.sprites.other["official-artwork"].front_default}
            alt={p.name}
            class="mx-auto h-16 w-16 object-contain"
          />
          <div
            class="mt-1 truncate text-xs font-bold"
            style="color: var(--text)"
          >
            {formatName(p.name)}
          </div>
          <div class="mt-1 flex justify-center gap-0.5">
            {#each p.types as t}<TypeBadge type={t} size="xs" />{/each}
          </div>
          {#if hasSet}
            <div
              class="bg-pokemon-green/20 text-pokemon-green mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold"
            >
              set
            </div>
          {/if}
        </div>
      {:else}
        <div
          class="flex min-h-36 items-center justify-center rounded-3xl border border-dashed border-white/10 text-xs text-white/20"
        >
          Slot {i + 1}
        </div>
      {/if}
    {/each}
  </div>

  {#if editingIndex != null && team[editingIndex]}
    {@const i = editingIndex}
    {@const p = team[i]}
    {@const s = sets[i] ?? initSet()}
    {@const color = TYPE_COLORS[p.types[0]] || "#777"}
    <div class="panel mb-8 max-w-2xl">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img
            src={p.sprites.other["official-artwork"].front_default}
            alt={p.name}
            class="h-12 w-12 object-contain"
          />
          <div>
            <div class="text-lg font-bold" style="color: var(--text)">
              {formatName(p.name)}
            </div>
            <div class="flex gap-1">
              {#each p.types as t}<TypeBadge type={t} size="xs" />{/each}
            </div>
          </div>
        </div>
        <button
          onclick={saveSet}
          class="bg-accent hover:bg-accent/80 cursor-pointer rounded-xl border-0 px-5 py-2 text-sm font-semibold text-white"
          >Done</button
        >
      </div>

      {#if editLoading}
        <div class="flex justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      {:else}
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <div
              class="text-[10px] font-bold tracking-wider text-white/40 uppercase"
            >
              Moves
            </div>
            <div class="mt-2 space-y-2">
              {#each Array(4) as _, mi}
                {@const dkey = `${i}-${mi}`}
                {@const open = moveDropdowns[dkey] ?? false}
                <Dropdown
                  {open}
                  onopen={(v) =>
                    (moveDropdowns = { ...moveDropdowns, [dkey]: v })}
                  selected={s.moves[mi]}
                  onselect={(name) => pickMove(mi, name)}
                  onclear={() => pickMove(mi, "")}
                  placeholder={`Move ${mi + 1}...`}
                  options={moveOptions
                    .filter(
                      (m) =>
                        !s.moves.some((sm, j) => sm === m.name && j !== mi),
                    )
                    .map((m) => ({
                      value: m.name,
                      badge: m.type,
                      meta: `${m.power ?? "—"}/${m.accuracy ?? "—"}/${m.pp ?? "—"}`,
                    }))}
                >
                  {#snippet button(selected: string)}
                    {#if selected}
                      {@const move = moveOptions.find(
                        (o) => o.name === selected,
                      )}
                      <span class="flex items-center gap-1.5">
                        {#if move}
                          <TypeBadge
                            type={move.type}
                            size="xs"
                            tooltip={false}
                          />
                        {/if}
                        <span>{formatName(selected)}</span>
                        {#if move}
                          <span class="ml-auto text-[10px] text-white/30"
                            >{move.power ?? "—"}/{move.accuracy ??
                              "—"}/{move.pp ?? "—"}</span
                          >
                        {/if}
                      </span>
                    {:else}
                      Move {mi + 1}...
                    {/if}
                  {/snippet}
                </Dropdown>
              {/each}
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <div
                class="text-[10px] font-bold tracking-wider text-white/40 uppercase"
              >
                Ability
              </div>
              <div class="relative">
                <Dropdown
                  open={abilityDropdowns[`ability-${i}`] ?? false}
                  onopen={(v) =>
                    (abilityDropdowns = {
                      ...abilityDropdowns,
                      [`ability-${i}`]: v,
                    })}
                  selected={s.ability}
                  onselect={pickAbility}
                  onclear={() => pickAbility("")}
                  buttonClass="mt-2"
                  options={abilityOptions.map((a) => ({
                    value: a.name,
                    label: formatName(a.name),
                    hint: a.description ?? undefined,
                  }))}
                />
              </div>
            </div>
            <div>
              <div
                class="text-[10px] font-bold tracking-wider text-white/40 uppercase"
              >
                Nature
              </div>
              <div class="relative">
                <Dropdown
                  open={natureDropdowns[`nature-${i}`] ?? false}
                  onopen={(v) =>
                    (natureDropdowns = {
                      ...natureDropdowns,
                      [`nature-${i}`]: v,
                    })}
                  selected={s.nature}
                  onselect={pickNature}
                  onclear={() => pickNature("")}
                  buttonClass="mt-2"
                  options={NATURES.map((n) => ({
                    value: n,
                    meta: NATURES_MODIFIERS[n],
                  }))}
                />
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between">
                <div
                  class="text-[10px] font-bold tracking-wider text-white/40 uppercase"
                >
                  EVs
                </div>
                <span class="text-[10px] text-white/40"
                  >{evTotal(s.evs)} / 510</span
                >
                {#if evWarning}
                  <span class="text-pokemon-red text-[10px]">{evWarning}</span>
                {/if}
              </div>
              <div class="mt-2 grid grid-cols-3 gap-2">
                {#each EV_STATS as { key, label }}
                  <div class="flex items-center gap-1">
                    <span
                      class="w-7 text-right text-[9px] font-bold text-white/40"
                      >{label}</span
                    >
                    <input
                      type="number"
                      min="0"
                      max="252"
                      value={s.evs[key] || 0}
                      oninput={(e) =>
                        setEv(
                          key,
                          parseInt((e.target as HTMLInputElement).value) || 0,
                        )}
                      class="focus:border-accent/50 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none"
                    />
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  {#if team.length === 0}
    <EmptyState
      title="Build your team"
      subtitle="Add up to 6 Pokémon, click a card to configure movesets, and export a share link."
    />
  {:else}
    <div class="mb-6 grid gap-4 md:grid-cols-2">
      <div class="panel">
        <h2 class="mb-4 text-lg font-bold">Type Heat Map</h2>
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {#each ALL_TYPES as t}
            {@const c = coverage[t]}
            <Tooltip width="w-max">
              {#snippet popup()}
                <TypePopup type={t} />
              {/snippet}
              {#snippet trigger()}
                <div
                  class="cursor-pointer rounded-lg px-2 py-2 text-center text-[10px] font-bold uppercase"
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
                  <span class="block" style="color: {TYPE_COLORS[t]}">{t}</span>
                  <span class="opacity-60"
                    >{c >= 2 ? "Weak" : c <= -1 ? "Safe" : "OK"}</span
                  >
                </div>
              {/snippet}
            </Tooltip>
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
        <div>
          <h3
            class="text-pokemon-red mb-2 text-xs font-bold tracking-wider uppercase"
          >
            Strong coverage
          </h3>
          <div class="flex flex-wrap gap-1.5">
            {#if teamStrong.length === 0}
              <span class="text-xs text-white/40"
                >{teamHasMoves
                  ? "Nothing hits super effectively"
                  : "Pick moves to see coverage"}</span
              >
            {:else}{#each teamStrong as t}<TypeBadge
                  type={t}
                  size="sm"
                />{/each}{/if}
          </div>
        </div>
        <div>
          <h3
            class="text-pokemon-green mb-2 text-xs font-bold tracking-wider uppercase"
          >
            Blind spots
          </h3>
          <div class="flex flex-wrap gap-1.5">
            {#if teamBlind.length === 0}
              <span class="text-xs text-white/40"
                >{teamHasMoves
                  ? "None — great coverage!"
                  : "Pick moves to see coverage"}</span
              >
            {:else}{#each teamBlind as t}<TypeBadge
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
    <div class="panel mb-6">
      <h2 class="mb-5 text-lg font-bold">Team Summary</h2>
      <div class="space-y-4">
        {#each team as p, i}
          {@const s = sets[i]}
          <div class="rounded-2xl border border-white/6 bg-white/2 p-4">
            <div class="flex flex-wrap items-start gap-4">
              <img
                src={p.sprites.other["official-artwork"].front_default}
                alt={p.name}
                class="h-16 w-16 shrink-0 object-contain"
              />
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-base font-bold" style="color: var(--text)"
                    >{formatName(p.name)}</span
                  >
                  <div class="flex gap-1">
                    {#each p.types as t}<TypeBadge type={t} size="xs" />{/each}
                  </div>
                </div>
                {#if s}
                  <div
                    class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
                  >
                    <span class="text-white/40">Moves:</span>
                    {#each s.moves as m, mi}
                      {#if m}
                        {@const move = metaCache[p.name]?.moves.find(
                          (o) => o.name === m,
                        )}
                        <MoveTooltip move={move ?? { name: m }} />
                      {:else}
                        <span
                          class="cursor-default rounded-full border border-dashed border-white/10 px-2 py-0.5 text-[11px] text-white/20"
                          >move {mi + 1}</span
                        >
                      {/if}
                    {/each}
                  </div>
                  <div
                    class="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px]"
                  >
                    <Tooltip width="w-56">
                      {#snippet popup()}
                        {#if s.ability}
                          <div
                            class="mb-1 block font-semibold"
                            style="color: var(--text)"
                          >
                            {formatName(s.ability)}
                          </div>
                          {abilityTooltip(p.name, s.ability)}
                        {/if}
                      {/snippet}
                      {#snippet trigger()}
                        <span class="text-white/40">Ability:</span>
                        <span class="text-white/70">
                          {s.ability ? formatName(s.ability) : "—"}
                        </span>
                      {/snippet}
                    </Tooltip>
                    <Tooltip width="" nowrap>
                      {#snippet popup()}
                        {#if s.nature}
                          <div style="color: var(--text)">
                            {s.nature}: {NATURES_MODIFIERS[s.nature] ??
                              "neutral"}
                          </div>
                        {/if}
                      {/snippet}
                      {#snippet trigger()}
                        <span class="text-white/40">Nature:</span>
                        <span class="text-white/70"> {s.nature || "—"}</span>
                      {/snippet}
                    </Tooltip>
                    <Tooltip width="" nowrap>
                      {#snippet popup()}
                        <div style="color: var(--text)">
                          HP / Atk / Def / SpA / SpD / Spe
                        </div>
                      {/snippet}
                      {#snippet trigger()}
                        <span class="text-white/40">EVs:</span>
                        <span class="text-white/70">
                          {s.evs?.hp ?? 0}/{s.evs?.atk ?? 0}/{s.evs?.def ??
                            0}/{s.evs?.spa ?? 0}/{s.evs?.spd ?? 0}/{s.evs
                            ?.spe ?? 0}</span
                        >
                      {/snippet}
                    </Tooltip>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
