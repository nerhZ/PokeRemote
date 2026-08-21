<script lang="ts">
  import { page } from "$app/state";
  import { resolve } from "$app/paths";
  import {
    getPokemonDetail,
    getPokemonMetadata,
    getAutocompleteList,
    type AbilitySummary,
  } from "$lib/api";
  import { pageUrlSync, selectPokemonSlot } from "$lib/url-state";
  import {
    TYPE_COLORS,
    ALL_TYPES,
    TYPE_CHART,
    NATURES,
    NATURES_MODIFIERS,
    NATURE_STAT_MODS,
    NATURE_OPTIONS,
    STAT_DEFS,
    formatName,
    statValue,
    typeColor,
    type MoveDetail,
    type PokemonDetail,
  } from "$lib/pokemon-types";
  import {
    parseShowdownTeam,
    formatShowdownSet,
    showdownNameToApi,
    moveNameToApi,
  } from "$lib/showdown";
  import {
    saveTeam,
    getSavedTeams,
    zeroEvs,
    evTotal,
    evsLine,
    evsEncode,
    evsDecode,
    setEvValue,
    type EvSpread,
  } from "$lib/storage";
  import PokemonSearch from "$lib/components/PokemonSearch.svelte";
  import TypeBadge from "$lib/components/TypeBadge.svelte";
  import MoveTooltip from "$lib/components/MoveTooltip.svelte";
  import Tooltip from "$lib/components/Tooltip.svelte";
  import Dropdown from "$lib/components/Dropdown.svelte";
  import EVInput from "$lib/components/EVInput.svelte";
  import PokemonImage from "$lib/components/PokemonImage.svelte";
  import TypePopup from "$lib/components/TypePopup.svelte";
  import Pokeball from "$lib/components/Pokeball.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import ClearButton from "$lib/components/ClearButton.svelte";
  import { clamp, flash } from "$lib/utils";
  import { onMount } from "svelte";

  let allNames: { name: string; id: number }[] = $state([]);
  let search = $state("");
  let team: PokemonDetail[] = $state([]);
  let loading = $state(false);
  let teamName = $state("My Team");
  let saved = $state<ReturnType<typeof getSavedTeams>>([]);
  let copied = $state(false);
  let slotError = $state("");

  let editingIndex = $state<number | null>(null);
  let editLoading = $state(false);
  let loadingTeam = $state(false);

  let moveOptions = $state<MoveDetail[]>([]);
  let abilityOptions = $state<AbilitySummary[]>([]);
  let metaCache = $state<
    Record<string, { moves: MoveDetail[]; abilities: AbilitySummary[] }>
  >({});
  type TeamSet = {
    moves: string[];
    ability: string;
    nature: string;
    evs: EvSpread;
  };
  let sets = $state<TeamSet[]>([]);
  let evWarning = $state("");
  let showImport = $state(false);
  let importText = $state("");
  let importError = $state("");
  let importLoading = $state(false);
  let showdownCopied = $state(false);
  let previewLevel = $state(50);

  const sync = pageUrlSync("/team-builder");

  onMount(async () => {
    saved = getSavedTeams();
    allNames = (await getAutocompleteList()).results;
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
    evWarning = "";
    slotError = "";
  }

  function setEv(stat: keyof EvSpread, val: number) {
    if (editingIndex == null) return;
    const i = editingIndex;
    const s = sets[i] ?? initSet();
    const clamped = clamp(val, 0, 252);
    const evs = setEvValue(s.evs, stat, val);
    evWarning = evs[stat] !== clamped ? "Total EVs cannot exceed 510" : "";
    updateSetAt(i, { evs });
  }

  /** Patch one team member's set immutably. */
  function updateSetAt(i: number, patch: Partial<TeamSet>) {
    sets = sets.map((set, idx) => (idx === i ? { ...set, ...patch } : set));
  }

  /** Fetch a species into the team (deduped by id), pad its set, and preload
      its move/ability metadata. False when the detail fetch failed. */
  async function addTeamMember(name: string): Promise<boolean> {
    try {
      const d = await getPokemonDetail(name);
      if (!team.some((t) => t.id === d.id)) {
        team = [...team, d];
        while (sets.length < team.length) sets = [...sets, initSet()];
      }
    } catch {
      return false;
    }
    if (!metaCache[name]) {
      try {
        const meta = await getPokemonMetadata(name);
        metaCache[name] = { moves: meta.moves, abilities: meta.abilities };
      } catch {}
    }
    return true;
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
    const s = sets[editingIndex];
    if (!s) return;
    updateSetAt(editingIndex, {
      moves: s.moves.map((m, j) => (j === slot ? name : m)),
    });
  }

  function pickAbility(name: string) {
    if (editingIndex == null) return;
    updateSetAt(editingIndex, { ability: name });
  }

  function pickNature(name: string) {
    if (editingIndex == null) return;
    updateSetAt(editingIndex, { nature: name });
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
    const rawSets = page.url.searchParams.get("s");
    if (names.every((n) => currentNames.has(n))) {
      // Same members. Only URL-carried set data that differs from the board
      // still needs applying (a shared link whose movesets differ); when the
      // encoded sets match - e.g. after our own syncUrl() - there's nothing
      // to load.
      if (!rawSets || rawSets === encodeSets()) return;
    }
    const decoded = rawSets ? decodeSets(rawSets) : [];
    loadingTeam = true;
    try {
      for (const n of names) {
        if (team.some((t) => t.name === n)) continue;
        await addTeamMember(n);
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

  let lastTeamUrl = "";
  $effect(() => {
    const url = page.url.href;
    if (loadingTeam) return;
    if (url === lastTeamUrl) return;
    lastTeamUrl = url;
    loadTeamFromUrl();
  });

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
    const decoded: TeamSet[] = [];
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

  /** Does a single set carry any user-chosen content? */
  function setHasContent(s: TeamSet | undefined): boolean {
    return (
      !!s &&
      (s.moves.some((m) => m) ||
        !!s.ability ||
        !!s.nature ||
        evTotal(s.evs) > 0)
    );
  }

  function hasSets() {
    return sets.some(setHasContent);
  }

  /** Current team + sets as share/query params. */
  function buildParams(): URLSearchParams {
    const params = new URLSearchParams();
    if (team.length) params.set("p", team.map((t) => t.name).join(","));
    if (hasSets()) params.set("s", encodeSets());
    return params;
  }

  function syncUrl() {
    sync.push(buildParams());
  }

  async function addToTeam(name: string) {
    if (team.length >= 6) return;
    search = "";
    slotError = "";
    await selectPokemonSlot(name, {
      setLoading: (v) => (loading = v),
      apply: (detail) => {
        if (!team.some((t) => t.id === detail.id)) {
          team = [...team, detail];
          sets = [...sets, initSet()];
          syncUrl();
        }
      },
      onError: (msg) => (slotError = msg),
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
    for (const [key, value] of buildParams()) url.searchParams.set(key, value);
    navigator.clipboard?.writeText(url.toString());
    flash((v) => (copied = v));
  }

  /** Pokémon Showdown team text built from the current team + sets. */
  function exportShowdown() {
    const text = team
      .map((p, i) => {
        const s = sets[i];
        return formatShowdownSet({
          name: p.name,
          moves: s?.moves ?? [],
          ability: s?.ability ?? "",
          nature: s?.nature ?? "",
          evs: s?.evs ?? zeroEvs(),
        });
      })
      .join("\n\n");
    navigator.clipboard?.writeText(text);
    flash((v) => (showdownCopied = v));
  }

  /**
   * Resolve a Showdown species slug to an API name. Gendered species
   * (basculegion, indeedee, meowstic…) are not in the /pokemon list under
   * their base name, and species like basculin have a differently-named
   * default variety, so fall back to the gendered candidates and finally to
   * the detail fetch (which resolves default varieties itself).
   */
  async function resolveImportSpecies(slug: string): Promise<string | null> {
    if (allNames.some((n) => n.name === slug)) return slug;
    const gendered = allNames.find(
      (n) => n.name === `${slug}-male` || n.name === `${slug}-female`,
    );
    if (gendered) return gendered.name;
    try {
      const d = await getPokemonDetail(slug);
      if (d && allNames.some((n) => n.name === d.name)) return d.name;
    } catch {}
    return null;
  }

  /** Parse a Showdown paste, resolve species against the API names, load the team. */
  async function importShowdown() {
    const parsed = parseShowdownTeam(importText);
    if (parsed.length === 0) {
      importError = "No Pokémon sets found in the pasted text.";
      return;
    }
    importError = "";
    importLoading = true;
    try {
      const resolved: { set: (typeof parsed)[number]; name: string | null }[] =
        [];
      for (const set of parsed) {
        const slug = showdownNameToApi(set.species);
        resolved.push({ set, name: await resolveImportSpecies(slug) });
      }
      const missing = resolved.filter((r) => !r.name).map((r) => r.set.species);
      if (missing.length > 0) {
        importError = `Couldn't recognize: ${missing.join(", ")}.`;
        return;
      }
      for (const { name } of resolved) {
        const n = name!;
        if (team.length >= 6) break;
        if (team.some((t) => t.name === n)) continue;
        if (!(await addTeamMember(n))) continue;
      }
      const bySpecies = new Map(resolved.map((r) => [r.name!, r.set]));
      sets = sets.map((s, i) => {
        const name = team[i]?.name;
        const parsedSet = bySpecies.get(name);
        if (!parsedSet) return s;
        const meta = metaCache[name];
        const moves = parsedSet.moves
          .map(moveNameToApi)
          .filter((m) => meta?.moves.some((o) => o.name === m))
          .slice(0, 4);
        return {
          ...s,
          moves: padMoves(moves),
          ability: meta?.abilities.some((a) => a.name === parsedSet.ability)
            ? parsedSet.ability
            : "",
          nature: NATURES.includes(parsedSet.nature) ? parsedSet.nature : "",
          evs: {
            hp: parsedSet.evs.hp ?? 0,
            atk: parsedSet.evs.atk ?? 0,
            def: parsedSet.evs.def ?? 0,
            spa: parsedSet.evs.spa ?? 0,
            spd: parsedSet.evs.spd ?? 0,
            spe: parsedSet.evs.spe ?? 0,
          },
        };
      });
      syncUrl();
      showImport = false;
      importText = "";
    } finally {
      importLoading = false;
    }
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

  /** The four coverage summary sections rendered beside the heat map. */
  let coverageSections = $derived([
    {
      title: "Shared weaknesses",
      color: "text-pokemon-red",
      types: teamWeak,
      empty: "None — nice!",
    },
    {
      title: "Resistances",
      color: "text-pokemon-green",
      types: teamSafe,
      empty: "None",
    },
    {
      title: "Strong coverage",
      color: "text-pokemon-red",
      types: teamStrong,
      empty: teamHasMoves
        ? "Nothing hits super effectively"
        : "Pick moves to see coverage",
    },
    {
      title: "Blind spots",
      color: "text-pokemon-green",
      types: teamBlind,
      empty: teamHasMoves
        ? "None — great coverage!"
        : "Pick moves to see coverage",
    },
  ]);

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
      parts.push(`EVs: ${evsLine(evs)}`);
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
      <ClearButton onclick={clearState} />
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
    {#if loading}<div class="mt-2 flex justify-center">
        <Pokeball spinning class="h-6 w-6" />
      </div>{/if}
    {#if slotError}<p class="text-pokemon-red mt-2 text-xs" role="alert">
        {slotError}
      </p>{/if}
    <button
      onclick={() => {
        showImport = !showImport;
        importError = "";
      }}
      class="mt-3 cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/60 transition-colors hover:text-white"
      >{showImport ? "Close import" : "Import from Showdown ⤒"}</button
    >
    {#if showImport}
      <div class="mt-3 space-y-2">
        <textarea
          bind:value={importText}
          rows={6}
          aria-label="Paste a Pokémon Showdown team"
          placeholder={"Paste a Showdown team here, e.g.\n\nGarchomp @ Rocky Helmet\nAbility: Rough Skin\nEVs: 252 HP / 4 Atk / 252 Spe\nJolly Nature\n- Earthquake\n- Stealth Rock\n- Dragon Claw\n- Swords Dance"}
          class="focus:border-accent/50 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white/80 placeholder-white/25 outline-none"
        ></textarea>
        {#if importError}<p class="text-pokemon-red text-xs" role="alert">
            {importError}
          </p>{/if}
        <div class="flex items-center gap-2">
          <button
            onclick={importShowdown}
            disabled={importLoading || !importText.trim()}
            class="bg-accent hover:bg-accent/80 cursor-pointer rounded-xl border-0 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >{importLoading ? "Importing…" : "Import"}</button
          >
          <span class="text-[10px] text-white/40"
            >Up to 6 · moves/ability/nature/EVs are applied, items and levels
            are skipped</span
          >
        </div>
      </div>
    {/if}
  </div>

  <div class="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
    {#each Array(6) as _, i}
      {#if team[i]}
        {@const p = team[i]}
        {@const color = typeColor(p.types)}
        {@const hasSet = setHasContent(sets[i])}
        <div class="relative transition-all hover:-translate-y-1">
          <button
            type="button"
            class="panel relative w-full cursor-pointer p-3! text-center"
            style="box-shadow: inset 0 0 0 1px {color}40"
            onclick={() => editPokemon(i)}
            title={hoverTitle(i)}
          >
            <PokemonImage
              src={p.sprites.other["official-artwork"].front_default}
              id={p.id}
              alt={p.name}
              class="mx-auto h-16 w-16 object-contain"
            />
            <span
              class="mt-1 block truncate text-xs font-bold"
              style="color: var(--text)"
            >
              {formatName(p.name)}
            </span>
            <span class="mt-1 flex justify-center gap-0.5">
              {#each p.types as t}<TypeBadge type={t} size="xs" />{/each}
            </span>
            {#if hasSet}
              <span
                class="bg-pokemon-green/20 text-pokemon-green mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold"
              >
                set
              </span>
            {/if}
          </button>
          <a
            href={resolve(`/pokemon/${p.name}`)}
            class="absolute top-2 left-2 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-black/20 text-xs text-white/50 no-underline hover:text-white"
            title="Open Pokédex">◉</a
          >
          <button
            type="button"
            onclick={() => removeFromTeam(p.id)}
            aria-label="Remove from team"
            class="bg-pokemon-red/20 text-pokemon-red hover:bg-pokemon-red/40 absolute top-2 right-2 z-10 h-6 w-6 cursor-pointer rounded-md border-0 text-xs font-bold transition-colors"
            >×</button
          >
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
    {@const color = typeColor(p.types)}
    <div class="panel mb-8 max-w-2xl">
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <PokemonImage
            src={p.sprites.other["official-artwork"].front_default}
            id={p.id}
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
          <Pokeball spinning class="h-8 w-8" />
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
                <Dropdown
                  selected={s.moves[mi]}
                  onselect={(name) => pickMove(mi, name)}
                  onclear={() => pickMove(mi, "")}
                  placeholder={`Move ${mi + 1}...`}
                  searchable
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
                  selected={s.ability}
                  onselect={pickAbility}
                  onclear={() => pickAbility("")}
                  buttonClass="mt-2"
                  searchable
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
                  selected={s.nature}
                  onselect={pickNature}
                  onclear={() => pickNature("")}
                  buttonClass="mt-2"
                  options={NATURE_OPTIONS}
                />
              </div>
            </div>
            <div>
              <EVInput
                evs={s.evs}
                oninput={setEv}
                warning={evWarning}
                cols="grid-cols-3"
              />
            </div>
            <div class="mt-4">
              <div class="flex items-center justify-between">
                <span
                  class="text-[10px] font-bold tracking-wider text-white/40 uppercase"
                >
                  Final stats
                </span>
                <div class="flex gap-1">
                  {#each [50, 100] as lv}
                    <button
                      onclick={() => (previewLevel = lv)}
                      class="cursor-pointer rounded-full border px-2 py-0.5 text-[10px] font-bold {previewLevel ===
                      lv
                        ? 'bg-accent border-accent text-white'
                        : 'border-white/10 bg-white/5 text-white/50 hover:text-white'}"
                    >
                      Lv {lv}
                    </button>
                  {/each}
                </div>
              </div>
              <div class="mt-2 grid grid-cols-6 gap-1.5 text-center">
                {#each STAT_DEFS as def}
                  {@const base =
                    p.stats.find((st) => st.name === def.apiName)?.base_stat ??
                    0}
                  {@const mods = s.nature ? NATURE_STAT_MODS[s.nature] : null}
                  {@const val = statValue(base, previewLevel, {
                    iv: 31,
                    ev: s.evs[def.evKey] ?? 0,
                    hp: def.evKey === "hp",
                    nature: mods,
                    statKey: def.apiName,
                  })}
                  <div class="rounded-lg bg-white/3 px-1 py-1.5">
                    <div class="text-[9px] text-white/40">{def.shortLabel}</div>
                    <div class="text-xs font-bold" style="color: var(--text)">
                      {val}
                    </div>
                    <div class="text-[9px] text-white/30">
                      {mods?.up === def.apiName
                        ? "▲"
                        : mods?.down === def.apiName
                          ? "▼"
                          : ""}{base}
                    </div>
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
                <!-- svelte-ignore a11y_no_noninteractive_tabindex: tooltip trigger; focus reveals the popup -->
                <div
                  tabindex="0"
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
        {#each coverageSections as section}
          <div>
            <h3
              class="{section.color} mb-2 text-xs font-bold tracking-wider uppercase"
            >
              {section.title}
            </h3>
            <div class="flex flex-wrap gap-1.5">
              {#if section.types.length === 0}
                <span class="text-xs text-white/40">{section.empty}</span>
              {:else}
                {#each section.types as t}<TypeBadge
                    type={t}
                    size="sm"
                  />{/each}
              {/if}
            </div>
          </div>
        {/each}
        <div
          class="flex flex-wrap items-center gap-2 border-t border-white/6 pt-3"
        >
          <input
            bind:value={teamName}
            aria-label="Team name"
            class="focus:border-accent/50 min-w-30 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
            placeholder="Team name"
          />
          <button
            onclick={exportTeam}
            class="bg-accent hover:bg-accent/80 cursor-pointer rounded-xl border-0 px-4 py-2 text-sm font-semibold text-white"
            >{copied ? "Link copied!" : "Save & share"}</button
          >
          <button
            onclick={exportShowdown}
            class="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/60 transition-colors hover:text-white"
            >{showdownCopied ? "Copied!" : "Showdown ⤓"}</button
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
              <PokemonImage
                src={p.sprites.other["official-artwork"].front_default}
                id={p.id}
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
                        <!-- svelte-ignore a11y_no_noninteractive_tabindex: tooltip trigger; focus reveals the popup -->
                        <span
                          tabindex="0"
                          class="inline-flex items-baseline gap-1"
                        >
                          <span class="text-white/40">Ability:</span>
                          <span class="text-white/70">
                            {s.ability ? formatName(s.ability) : "—"}
                          </span>
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
                        <!-- svelte-ignore a11y_no_noninteractive_tabindex: tooltip trigger; focus reveals the popup -->
                        <span
                          tabindex="0"
                          class="inline-flex items-baseline gap-1"
                        >
                          <span class="text-white/40">Nature:</span>
                          <span class="text-white/70"> {s.nature || "—"}</span>
                        </span>
                      {/snippet}
                    </Tooltip>
                    <Tooltip width="" nowrap>
                      {#snippet popup()}
                        <div style="color: var(--text)">
                          HP / Atk / Def / SpA / SpD / Spe
                        </div>
                      {/snippet}
                      {#snippet trigger()}
                        <!-- svelte-ignore a11y_no_noninteractive_tabindex: tooltip trigger; focus reveals the popup -->
                        <span
                          tabindex="0"
                          class="inline-flex items-baseline gap-1"
                        >
                          <span class="text-white/40">EVs:</span>
                          <span class="text-white/70">
                            {evsLine(s.evs ?? zeroEvs())}</span
                          >
                        </span>
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
