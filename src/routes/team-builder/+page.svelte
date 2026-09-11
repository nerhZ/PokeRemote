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
  import * as stylex from "@stylexjs/stylex";
  import { shared } from "$lib/styles/shared.stylex";
  import { dynamic } from "../../lib/styles/dynamic.stylex";
  import { styles } from "./styles";

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
      color: styles.sectionRed,
      types: teamWeak,
      empty: "None — nice!",
    },
    {
      title: "Resistances",
      color: styles.sectionGreen,
      types: teamSafe,
      empty: "None",
    },
    {
      title: "Strong coverage",
      color: styles.sectionRed,
      types: teamStrong,
      empty: teamHasMoves
        ? "Nothing hits super effectively"
        : "Pick moves to see coverage",
    },
    {
      title: "Blind spots",
      color: styles.sectionGreen,
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

<div {...stylex.attrs(shared.toolShell)}>
  <div {...stylex.attrs(shared.toolHero)}>
    <div {...stylex.attrs(styles.heroRow)}>
      <div>
        <h1 {...stylex.attrs(shared.toolHeroTitle)}>Team Builder</h1>
        <p {...stylex.attrs(shared.toolHeroText)}>
          Six slots, movesets, share with competitive setups.
        </p>
      </div>
      <ClearButton onclick={clearState} />
    </div>
  </div>

  <div {...stylex.attrs(shared.panel, styles.searchPanel)}>
    <PokemonSearch
      bind:value={search}
      options={allNames.filter((n) => !team.some((t) => t.id === n.id))}
      disabled={team.length >= 6}
      placeholder={team.length >= 6 ? "Team is full" : "Add a Pokémon..."}
      onselect={addToTeam}
    />
    {#if loading}<div {...stylex.attrs(styles.loadingRow)}>
        <Pokeball spinning sx={styles.pokeballSm} />
      </div>{/if}
    {#if slotError}<p
        {...stylex.attrs(styles.errorText, styles.slotError)}
        role="alert"
      >
        {slotError}
      </p>{/if}
    <button
      onclick={() => {
        showImport = !showImport;
        importError = "";
      }}
      {...stylex.attrs(styles.secondaryButton, styles.importToggle)}
      >{showImport ? "Close import" : "Import from Showdown ⤒"}</button
    >
    {#if showImport}
      <div {...stylex.attrs(styles.stack2, styles.importArea)}>
        <textarea
          bind:value={importText}
          rows={6}
          aria-label="Paste a Pokémon Showdown team"
          placeholder={"Paste a Showdown team here, e.g.\n\nGarchomp @ Rocky Helmet\nAbility: Rough Skin\nEVs: 252 HP / 4 Atk / 252 Spe\nJolly Nature\n- Earthquake\n- Stealth Rock\n- Dragon Claw\n- Swords Dance"}
          {...stylex.attrs(styles.importTextarea)}></textarea>
        {#if importError}<p {...stylex.attrs(styles.errorText)} role="alert">
            {importError}
          </p>{/if}
        <div {...stylex.attrs(styles.importActions)}>
          <button
            onclick={importShowdown}
            disabled={importLoading || !importText.trim()}
            {...stylex.attrs(styles.accentButton, styles.importButton)}
            >{importLoading ? "Importing…" : "Import"}</button
          >
          <span {...stylex.attrs(styles.hintText)}
            >Up to 6 · moves/ability/nature/EVs are applied, items and levels
            are skipped</span
          >
        </div>
      </div>
    {/if}
  </div>

  <div {...stylex.attrs(styles.slotsGrid)}>
    {#each Array(6) as _, i}
      {#if team[i]}
        {@const p = team[i]}
        {@const color = typeColor(p.types)}
        {@const hasSet = setHasContent(sets[i])}
        <div {...stylex.attrs(styles.slotWrap)}>
          <button
            type="button"
            {...stylex.attrs(
              shared.panel,
              styles.slotButton,
              dynamic.boxShadow(`inset 0 0 0 1px ${color}40`),
            )}
            onclick={() => editPokemon(i)}
            title={hoverTitle(i)}
          >
            <PokemonImage
              src={p.sprites.other["official-artwork"].front_default}
              id={p.id}
              alt={p.name}
              sx={styles.slotImage}
            />
            <span {...stylex.attrs(styles.slotName)}>
              {formatName(p.name)}
            </span>
            <span {...stylex.attrs(styles.slotTypes)}>
              {#each p.types as t}<TypeBadge type={t} size="xs" />{/each}
            </span>
            {#if hasSet}
              <span {...stylex.attrs(styles.setBadge)}> set </span>
            {/if}
          </button>
          <a
            href={resolve(`/pokemon/${p.name}`)}
            {...stylex.attrs(styles.slotLink)}
            title="Open Pokédex">◉</a
          >
          <button
            type="button"
            onclick={() => removeFromTeam(p.id)}
            aria-label="Remove from team"
            {...stylex.attrs(styles.removeButton)}>×</button
          >
        </div>
      {:else}
        <div {...stylex.attrs(styles.emptySlot)}>
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
    <div {...stylex.attrs(shared.panel, styles.editorPanel)}>
      <div {...stylex.attrs(styles.editorHeader)}>
        <div {...stylex.attrs(styles.editorHeadLeft)}>
          <PokemonImage
            src={p.sprites.other["official-artwork"].front_default}
            id={p.id}
            alt={p.name}
            sx={styles.editorImage}
          />
          <div>
            <div {...stylex.attrs(styles.editorName)}>
              {formatName(p.name)}
            </div>
            <div {...stylex.attrs(styles.typeRow)}>
              {#each p.types as t}<TypeBadge type={t} size="xs" />{/each}
            </div>
          </div>
        </div>
        <button
          onclick={saveSet}
          {...stylex.attrs(styles.accentButton, styles.doneButton)}>Done</button
        >
      </div>

      {#if editLoading}
        <div {...stylex.attrs(styles.loadingBox)}>
          <Pokeball spinning sx={styles.pokeballMd} />
        </div>
      {:else}
        <div {...stylex.attrs(styles.editorGrid)}>
          <div>
            <div {...stylex.attrs(styles.sectionLabel)}>Moves</div>
            <div {...stylex.attrs(styles.movesList)}>
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
                      <span {...stylex.attrs(styles.moveOption)}>
                        {#if move}
                          <TypeBadge
                            type={move.type}
                            size="xs"
                            tooltip={false}
                          />
                        {/if}
                        <span>{formatName(selected)}</span>
                        {#if move}
                          <span {...stylex.attrs(styles.moveMeta)}
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
          <div {...stylex.attrs(styles.editorColumn)}>
            <div>
              <div {...stylex.attrs(styles.sectionLabel)}>Ability</div>
              <div {...stylex.attrs(styles.relative)}>
                <Dropdown
                  selected={s.ability}
                  onselect={pickAbility}
                  onclear={() => pickAbility("")}
                  buttonSx={styles.buttonMt2}
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
              <div {...stylex.attrs(styles.sectionLabel)}>Nature</div>
              <div {...stylex.attrs(styles.relative)}>
                <Dropdown
                  selected={s.nature}
                  onselect={pickNature}
                  onclear={() => pickNature("")}
                  buttonSx={styles.buttonMt2}
                  options={NATURE_OPTIONS}
                />
              </div>
            </div>
            <div>
              <EVInput
                evs={s.evs}
                oninput={setEv}
                warning={evWarning}
                cols={3}
              />
            </div>
            <div {...stylex.attrs(styles.finalStats)}>
              <div {...stylex.attrs(styles.finalStatsHead)}>
                <span {...stylex.attrs(styles.sectionLabel)}>
                  Final stats
                </span>
                <div {...stylex.attrs(styles.typeRow)}>
                  {#each [50, 100] as lv}
                    <button
                      onclick={() => (previewLevel = lv)}
                      {...stylex.attrs(
                        styles.levelButton,
                        previewLevel === lv
                          ? styles.levelButtonActive
                          : styles.levelButtonIdle,
                      )}
                    >
                      Lv {lv}
                    </button>
                  {/each}
                </div>
              </div>
              <div {...stylex.attrs(styles.statsGrid)}>
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
                  <div {...stylex.attrs(styles.statCell)}>
                    <div {...stylex.attrs(styles.statLabel)}>
                      {def.shortLabel}
                    </div>
                    <div {...stylex.attrs(styles.statValue)}>
                      {val}
                    </div>
                    <div {...stylex.attrs(styles.statBase)}>
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
    <div {...stylex.attrs(styles.coverageGrid)}>
      <div {...stylex.attrs(shared.panel)}>
        <h2 {...stylex.attrs(styles.panelTitle)}>Type Heat Map</h2>
        <div {...stylex.attrs(styles.heatGrid)}>
          {#each ALL_TYPES as t}
            {@const c = coverage[t]}
            <Tooltip popupSx={styles.tooltipWide}>
              {#snippet popup()}
                <TypePopup type={t} />
              {/snippet}
              {#snippet trigger()}
                <!-- svelte-ignore a11y_no_noninteractive_tabindex: tooltip trigger; focus reveals the popup -->
                <div
                  tabindex="0"
                  {...stylex.attrs(
                    styles.heatCell,
                    c >= 2
                      ? styles.heatWeak
                      : c <= -1
                        ? styles.heatSafe
                        : styles.heatOk,
                  )}
                >
                  <span
                    {...stylex.attrs(
                      styles.heatTypeName,
                      dynamic.color(TYPE_COLORS[t]),
                    )}>{t}</span
                  >
                  <span {...stylex.attrs(styles.opacity60)}
                    >{c >= 2 ? "Weak" : c <= -1 ? "Safe" : "OK"}</span
                  >
                </div>
              {/snippet}
            </Tooltip>
          {/each}
        </div>
      </div>
      <div {...stylex.attrs(shared.panel, styles.coveragePanel)}>
        {#each coverageSections as section}
          <div>
            <h3 {...stylex.attrs(styles.coverageHeading, section.color)}>
              {section.title}
            </h3>
            <div {...stylex.attrs(styles.coverageTypes)}>
              {#if section.types.length === 0}
                <span {...stylex.attrs(styles.coverageEmpty)}
                  >{section.empty}</span
                >
              {:else}
                {#each section.types as t}<TypeBadge
                    type={t}
                    size="sm"
                  />{/each}
              {/if}
            </div>
          </div>
        {/each}
        <div {...stylex.attrs(styles.teamFooter)}>
          <input
            bind:value={teamName}
            aria-label="Team name"
            {...stylex.attrs(styles.teamNameInput)}
            placeholder="Team name"
          />
          <button
            onclick={exportTeam}
            {...stylex.attrs(styles.accentButton, styles.shareButton)}
            >{copied ? "Link copied!" : "Save & share"}</button
          >
          <button
            onclick={exportShowdown}
            {...stylex.attrs(styles.secondaryButton)}
            >{showdownCopied ? "Copied!" : "Showdown ⤓"}</button
          >
        </div>
        {#if saved.length}
          <div>
            <h3 {...stylex.attrs(styles.savedTitle)}>Saved teams</h3>
            <div {...stylex.attrs(styles.savedList)}>
              {#each saved.slice(0, 5) as t}
                <div {...stylex.attrs(styles.savedItem)}>
                  {t.name}: {t.names.map(formatName).join(", ")}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
    <div {...stylex.attrs(shared.panel, styles.summaryPanel)}>
      <h2 {...stylex.attrs(styles.summaryTitle)}>Team Summary</h2>
      <div {...stylex.attrs(styles.editorColumn)}>
        {#each team as p, i}
          {@const s = sets[i]}
          <div {...stylex.attrs(styles.summaryCard)}>
            <div {...stylex.attrs(styles.summaryRow)}>
              <PokemonImage
                src={p.sprites.other["official-artwork"].front_default}
                id={p.id}
                alt={p.name}
                sx={styles.summaryImage}
              />
              <div {...stylex.attrs(styles.summaryBody)}>
                <div {...stylex.attrs(styles.summaryNameRow)}>
                  <span {...stylex.attrs(styles.summaryName)}
                    >{formatName(p.name)}</span
                  >
                  <div {...stylex.attrs(styles.typeRow)}>
                    {#each p.types as t}<TypeBadge type={t} size="xs" />{/each}
                  </div>
                </div>
                {#if s}
                  <div {...stylex.attrs(styles.movesRow)}>
                    <span {...stylex.attrs(styles.muted40)}>Moves:</span>
                    {#each s.moves as m, mi}
                      {#if m}
                        {@const move = metaCache[p.name]?.moves.find(
                          (o) => o.name === m,
                        )}
                        <MoveTooltip move={move ?? { name: m }} />
                      {:else}
                        <span {...stylex.attrs(styles.emptyMove)}
                          >move {mi + 1}</span
                        >
                      {/if}
                    {/each}
                  </div>
                  <div {...stylex.attrs(styles.metaRow)}>
                    <Tooltip popupSx={styles.tooltipNarrow}>
                      {#snippet popup()}
                        {#if s.ability}
                          <div {...stylex.attrs(styles.tooltipTitle)}>
                            {formatName(s.ability)}
                          </div>
                          {abilityTooltip(p.name, s.ability)}
                        {/if}
                      {/snippet}
                      {#snippet trigger()}
                        <!-- svelte-ignore a11y_no_noninteractive_tabindex: tooltip trigger; focus reveals the popup -->
                        <span
                          tabindex="0"
                          {...stylex.attrs(styles.inlineTrigger)}
                        >
                          <span {...stylex.attrs(styles.muted40)}>Ability:</span
                          >
                          <span {...stylex.attrs(styles.muted70)}>
                            {s.ability ? formatName(s.ability) : "—"}
                          </span>
                        </span>
                      {/snippet}
                    </Tooltip>
                    <Tooltip nowrap popupSx={styles.tooltipWide}>
                      {#snippet popup()}
                        {#if s.nature}
                          <div {...stylex.attrs(styles.tooltipText)}>
                            {s.nature}: {NATURES_MODIFIERS[s.nature] ??
                              "neutral"}
                          </div>
                        {/if}
                      {/snippet}
                      {#snippet trigger()}
                        <!-- svelte-ignore a11y_no_noninteractive_tabindex: tooltip trigger; focus reveals the popup -->
                        <span
                          tabindex="0"
                          {...stylex.attrs(styles.inlineTrigger)}
                        >
                          <span {...stylex.attrs(styles.muted40)}>Nature:</span>
                          <span {...stylex.attrs(styles.muted70)}>
                            {s.nature || "—"}</span
                          >
                        </span>
                      {/snippet}
                    </Tooltip>
                    <Tooltip nowrap popupSx={styles.tooltipWide}>
                      {#snippet popup()}
                        <div {...stylex.attrs(styles.tooltipText)}>
                          HP / Atk / Def / SpA / SpD / Spe
                        </div>
                      {/snippet}
                      {#snippet trigger()}
                        <!-- svelte-ignore a11y_no_noninteractive_tabindex: tooltip trigger; focus reveals the popup -->
                        <span
                          tabindex="0"
                          {...stylex.attrs(styles.inlineTrigger)}
                        >
                          <span {...stylex.attrs(styles.muted40)}>EVs:</span>
                          <span {...stylex.attrs(styles.muted70)}>
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
