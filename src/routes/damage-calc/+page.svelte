<script lang="ts">
  import { page } from "$app/state";
  import { resolve } from "$app/paths";
  import {
    getPokemonMoves,
    getAutocompleteList,
    baseSpeciesName,
  } from "$lib/api";
  import { pageUrlSync, selectPokemonSlot } from "$lib/url-state";
  import {
    TYPE_COLORS,
    TYPE_CHART,
    NATURES,
    NATURE_OPTIONS,
    NATURES_MODIFIERS,
    NATURE_STAT_MODS,
    calculateDamage,
    statValue,
    formatName,
    multiplierLabel,
    type EvolutionStage,
    type MoveInfo,
    type PokemonDetail,
    type PokemonMoves,
  } from "$lib/pokemon-types";
  import {
    EV_STATS,
    zeroEvs,
    evTotal,
    evsEncode,
    evsDecode,
    setEvValue,
    type EvSpread,
  } from "$lib/storage";
  import PokemonSearch from "$lib/components/PokemonSearch.svelte";
  import TypeBadge from "$lib/components/TypeBadge.svelte";
  import MoveTooltip from "$lib/components/MoveTooltip.svelte";
  import Pokeball from "$lib/components/Pokeball.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import Dropdown from "$lib/components/Dropdown.svelte";
  import EVInput from "$lib/components/EVInput.svelte";
  import PokemonImage from "$lib/components/PokemonImage.svelte";
  import ClearButton from "$lib/components/ClearButton.svelte";
  import { clamp } from "$lib/utils";
  import { onMount, untrack } from "svelte";
  import * as stylex from "@stylexjs/stylex";
  import { shared } from "$lib/styles/shared.stylex";
  import { dynamic } from "../../lib/styles/dynamic.stylex";
  import { styles } from "./styles";

  let allNames: { name: string; id: number }[] = $state([]);
  let attacker = $state<PokemonDetail | null>(null);
  let defender = $state<PokemonDetail | null>(null);
  let moveList = $state<PokemonMoves | null>(null);
  let movesError = $state(false);
  let searchAtt = $state("");
  let searchDef = $state("");
  let selectedMove = $state<any>(null);
  let attLevel = $state(50);
  let defLevel = $state(50);
  let loadingAtt = $state(false);
  let loadingDef = $state(false);
  let attError = $state("");
  let defError = $state("");
  let moveFilter = $state("");
  let effectGen = 0;

  let attNature = $state("");
  let attItem = $state("");
  let defItem = $state("");
  let attIv = $state(31);
  let defIv = $state(31);
  let attEvs = $state<EvSpread>(zeroEvs());
  let defEvs = $state<EvSpread>(zeroEvs());

  let weather = $state("");
  let terrain = $state("");
  let crit = $state(false);
  let defNature = $state("");
  let roll = $state<"random" | "min" | "max">("random");

  const WEATHER_OPTIONS = [
    { value: "rain", label: "Rain" },
    { value: "sun", label: "Sun" },
    { value: "sand", label: "Sandstorm" },
    { value: "snow", label: "Snow" },
  ];

  const TERRAIN_OPTIONS = [
    { value: "electric", label: "Electric Terrain" },
    { value: "grassy", label: "Grassy Terrain" },
    { value: "psychic", label: "Psychic Terrain" },
    { value: "misty", label: "Misty Terrain" },
  ];

  const ROLL_OPTIONS = [
    { value: "random", label: "Random roll (85–100%)" },
    { value: "min", label: "Min roll (85%)" },
    { value: "max", label: "Max roll (100%)" },
  ];

  type CalcItem = {
    label: string;
    mult: number;
    stat?: "physical" | "special";
    type?: string;
    eff2x?: boolean;
  };

  const ATTACK_ITEMS: CalcItem[] = [
    { label: "Life Orb", mult: 1.3 },
    { label: "Choice Band", mult: 1.5, stat: "physical" },
    { label: "Choice Specs", mult: 1.5, stat: "special" },
    { label: "Expert Belt", mult: 1.2, eff2x: true },
    { label: "Muscle Band", mult: 1.1, stat: "physical" },
    { label: "Wise Glasses", mult: 1.1, stat: "special" },
    { label: "Silk Scarf", mult: 1.2, type: "normal" },
    { label: "Charcoal", mult: 1.2, type: "fire" },
    { label: "Mystic Water", mult: 1.2, type: "water" },
    { label: "Miracle Seed", mult: 1.2, type: "grass" },
    { label: "Magnet", mult: 1.2, type: "electric" },
    { label: "Never-Melt Ice", mult: 1.2, type: "ice" },
    { label: "Black Belt", mult: 1.2, type: "fighting" },
    { label: "Poison Barb", mult: 1.2, type: "poison" },
    { label: "Soft Sand", mult: 1.2, type: "ground" },
    { label: "Sharp Beak", mult: 1.2, type: "flying" },
    { label: "Twisted Spoon", mult: 1.2, type: "psychic" },
    { label: "Silver Powder", mult: 1.2, type: "bug" },
    { label: "Hard Stone", mult: 1.2, type: "rock" },
    { label: "Spell Tag", mult: 1.2, type: "ghost" },
    { label: "Dragon Fang", mult: 1.2, type: "dragon" },
    { label: "Metal Coat", mult: 1.2, type: "steel" },
    { label: "Black Glasses", mult: 1.2, type: "dark" },
    { label: "Pixie Plate", mult: 1.2, type: "fairy" },
  ];

  const DEFENSE_ITEMS: CalcItem[] = [
    { label: "Assault Vest", mult: 1.5, stat: "special" },
    { label: "Eviolite", mult: 1.5 },
  ];

  function clampInt(raw: string, min: number, max: number, fallback: number) {
    const v = parseInt(raw, 10);
    return Number.isNaN(v) ? fallback : clamp(v, min, max);
  }

  /** A Pokémon's base stat by API name, 0 when absent. */
  function baseStat(p: PokemonDetail, name: string): number {
    return p.stats.find((s) => s.name === name)?.base_stat ?? 0;
  }

  /** Not fully evolved: its species sits in its own evolution chain with at
      least one further stage (Eviolite only works on such Pokémon). Chain
      nodes are compared as base species names because regional-form views
      mirror node names to their variants ("rattata-alola"). */
  function isNfe(p: PokemonDetail): boolean {
    const target = baseSpeciesName(p.species_name);
    function hasChildren(stage: EvolutionStage): boolean {
      if (baseSpeciesName(stage.name) === target)
        return stage.children.length > 0;
      return stage.children.some(hasChildren);
    }
    return p.evolution ? hasChildren(p.evolution) : false;
  }

  const sync = pageUrlSync("/damage-calc");

  onMount(async () => {
    allNames = (await getAutocompleteList()).results;
  });

  $effect(() => {
    const gen = ++effectGen;
    const att = page.url.searchParams.get("att");
    const def = page.url.searchParams.get("def");
    const mv = page.url.searchParams.get("move");
    const al = page.url.searchParams.get("al");
    const dl = page.url.searchParams.get("dl");
    const n = page.url.searchParams.get("n");
    const ai = page.url.searchParams.get("ai");
    const di = page.url.searchParams.get("di");
    const ae = page.url.searchParams.get("ae");
    const de = page.url.searchParams.get("de");
    const it = page.url.searchParams.get("it");
    const dt = page.url.searchParams.get("dt");
    const w = page.url.searchParams.get("w");
    const ter = page.url.searchParams.get("ter");
    const c = page.url.searchParams.get("c");
    const dn = page.url.searchParams.get("dn");
    const r = page.url.searchParams.get("r");
    if (al) attLevel = clampInt(al, 1, 100, 50);
    else attLevel = 50;
    if (dl) defLevel = clampInt(dl, 1, 100, 50);
    else defLevel = 50;
    if (n && n in NATURE_STAT_MODS) attNature = n;
    else attNature = "";
    if (ai) attIv = clampInt(ai, 0, 31, 31);
    else attIv = 31;
    if (di) defIv = clampInt(di, 0, 31, 31);
    else defIv = 31;
    if (ae) attEvs = evsDecode(ae);
    else attEvs = zeroEvs();
    if (de) defEvs = evsDecode(de);
    else defEvs = zeroEvs();
    attItem = it ?? "";
    defItem = dt ?? "";
    weather = w && WEATHER_OPTIONS.some((o) => o.value === w) ? w : "";
    terrain = ter && TERRAIN_OPTIONS.some((o) => o.value === ter) ? ter : "";
    crit = c === "1";
    defNature = dn && dn in NATURE_STAT_MODS ? dn : "";
    roll = r === "min" || r === "max" ? r : "random";
    if (!att && !def) {
      attacker = null;
      defender = null;
      searchAtt = "";
      searchDef = "";
      selectedMove = null;
      moveList = null;
      movesError = false;
      attError = "";
      defError = "";
      return;
    }
    (async () => {
      if (att && untrack(() => attacker?.name) !== att)
        await selectAttacker(att, mv, gen, true);
      if (def && untrack(() => defender?.name) !== def)
        await selectDefender(def, gen, true);
    })();
  });

  function syncUrl() {
    const params = new URLSearchParams();
    if (attacker) params.set("att", attacker.name);
    if (defender) params.set("def", defender.name);
    if (selectedMove) params.set("move", selectedMove.name);
    if (attLevel !== 50) params.set("al", String(attLevel));
    if (defLevel !== 50) params.set("dl", String(defLevel));
    if (attNature) params.set("n", attNature);
    if (attIv !== 31) params.set("ai", String(attIv));
    if (defIv !== 31) params.set("di", String(defIv));
    if (evTotal(attEvs) > 0) params.set("ae", evsEncode(attEvs));
    if (evTotal(defEvs) > 0) params.set("de", evsEncode(defEvs));
    if (attItem) params.set("it", attItem);
    if (defItem) params.set("dt", defItem);
    if (weather) params.set("w", weather);
    if (terrain) params.set("ter", terrain);
    if (crit) params.set("c", "1");
    if (defNature) params.set("dn", defNature);
    if (roll !== "random") params.set("r", roll);
    sync.push(params);
  }

  function clearState() {
    sync.clear();
  }

  async function selectAttacker(
    name: string,
    preferMove?: string | null,
    gen?: number,
    skipSync?: boolean,
  ) {
    searchAtt = name;
    attError = "";
    moveFilter = "";
    await selectPokemonSlot(name, {
      gen,
      effectGen,
      setLoading: (v) => (loadingAtt = v),
      apply: async (p) => {
        attacker = p;
        selectedMove = null;
        moveList = null;
        movesError = false;
        const fetchName = name;
        try {
          const m = await getPokemonMoves(name, { levelUpOnly: true });
          // Discard stale results: switching attackers (or clearing) while
          // this fetch is in flight changes attacker.name.
          if (attacker?.name !== fetchName) return;
          moveList = m;
          if (preferMove && m) {
            selectedMove =
              m.level_up.find((mv) => mv.name === preferMove) ?? null;
          }
        } catch {
          if (attacker?.name !== fetchName) return;
          movesError = true;
        }
        if (!skipSync) syncUrl();
      },
      onError: (msg) => (attError = msg),
    });
  }

  async function selectDefender(
    name: string,
    gen?: number,
    skipSync?: boolean,
  ) {
    searchDef = name;
    defError = "";
    await selectPokemonSlot(name, {
      gen,
      effectGen,
      setLoading: (v) => (loadingDef = v),
      apply: (p) => {
        defender = p;
        if (!skipSync) syncUrl();
      },
      onError: (msg) => (defError = msg),
    });
  }

  function pickMove(m: any) {
    selectedMove = m;
    syncUrl();
  }

  function setAttEv(key: keyof EvSpread, val: number) {
    attEvs = setEvValue(attEvs, key, val);
    syncUrl();
  }

  function setDefEv(key: keyof EvSpread, val: number) {
    defEvs = setEvValue(defEvs, key, val);
    syncUrl();
  }

  function estimateKO(min: number, max: number, hp: number): string {
    if (min >= hp) return "OHKO";
    if (max >= hp) return "OHKO (high roll)";
    if (min * 2 >= hp) return "2HKO";
    if (max * 2 >= hp) return "2HKO (high roll)";
    if (min * 3 >= hp) return "3HKO";
    return "4HKO+";
  }

  function effectivenessLabel(effectiveness: number): string {
    if (effectiveness === 0) return "No effect";
    if (effectiveness < 1)
      return `Not very effective (${multiplierLabel(effectiveness)})`;
    if (effectiveness > 1)
      return `Super effective (${multiplierLabel(effectiveness)})`;
    return "Normal (1×)";
  }

  function attackItemMult(
    effectiveness: number,
    isSpecial: boolean,
    moveType: string,
  ): number {
    const item = ATTACK_ITEMS.find((i) => i.label === attItem);
    if (!item) return 1;
    if (item.type && moveType !== item.type) return 1;
    if (item.stat && (item.stat === "special") !== isSpecial) return 1;
    if (item.eff2x && effectiveness < 2) return 1;
    return item.mult;
  }

  function defenseItemMult(isSpecial: boolean): number {
    const item = DEFENSE_ITEMS.find((i) => i.label === defItem);
    if (!item || !defender) return 1;
    // Eviolite only boosts Pokémon that can still evolve.
    if (item.label === "Eviolite" && !isNfe(defender)) return 1;
    if (item.stat && (item.stat === "special") !== isSpecial) return 1;
    return item.mult;
  }

  type DamageResult =
    | { noDamage: true; label: string }
    | {
        noDamage: false;
        min: number;
        max: number;
        minPct: number;
        maxPct: number;
        effectiveness: number;
        effLabel: string;
        stab: boolean;
        isSpecial: boolean;
        atk: number;
        def: number;
        hp: number;
        ko: string;
        critRange: { min: number; max: number } | null;
        conditions: string[];
      };

  function weatherMult(moveType: string): number {
    if (weather === "rain")
      return moveType === "water" ? 1.5 : moveType === "fire" ? 0.5 : 1;
    if (weather === "sun")
      return moveType === "fire" ? 1.5 : moveType === "water" ? 0.5 : 1;
    return 1;
  }

  function terrainMult(moveType: string): number {
    if (terrain === "electric" && moveType === "electric") return 1.3;
    if (terrain === "grassy" && moveType === "grass") return 1.3;
    if (terrain === "psychic" && moveType === "psychic") return 1.3;
    if (terrain === "misty" && moveType === "dragon") return 0.5;
    return 1;
  }

  function computeMove(move: any): DamageResult | null {
    if (!attacker || !defender) return null;
    if (!move.power)
      return {
        noDamage: true as const,
        label: "This move deals no direct damage.",
      };

    const isSpecial = move.damage_class === "special";
    const atkKey = isSpecial ? "special-attack" : "attack";
    const defKey = isSpecial ? "special-defense" : "defense";
    const baseAtk = baseStat(attacker, atkKey);
    const baseDef = baseStat(defender, defKey);
    const baseHp = baseStat(defender, "hp");

    const nature = attNature ? NATURE_STAT_MODS[attNature] : null;
    const atkEv = attEvs[isSpecial ? "spa" : "atk"];
    const defEv = defEvs[isSpecial ? "spd" : "def"];
    const hpEv = defEvs.hp;

    const atk = statValue(baseAtk, attLevel, {
      iv: attIv,
      ev: atkEv,
      nature,
      statKey: atkKey,
    });
    const defNatureMods = defNature ? NATURE_STAT_MODS[defNature] : null;
    const def = statValue(baseDef, defLevel, {
      iv: defIv,
      ev: defEv,
      nature: defNatureMods,
      statKey: defKey,
    });
    const hp = statValue(baseHp, defLevel, {
      iv: defIv,
      ev: hpEv,
      hp: true,
      nature: null,
    });

    // Defender-typed environment bonuses: sand boosts Rock SpD (Gen IV+,
    // still active in Gen IX), snow boosts Ice Def (Gen IX). Gen VII+
    // critical hits ignore those boosts, so crits compute against the base
    // defense (items still apply; crits don't ignore items).
    const envDefMult =
      (weather === "sand" && isSpecial && defender.types.includes("rock")) ||
      (weather === "snow" && !isSpecial && defender.types.includes("ice"))
        ? 1.5
        : 1;
    const baseEffectiveDef = Math.floor(def * defenseItemMult(isSpecial));

    let effectiveness = 1;
    for (const dt of defender.types) {
      const mult = TYPE_CHART[move.type]?.[dt];
      if (mult !== undefined) effectiveness *= mult;
    }

    // Immunity: no damage is dealt at all, so report it like a status move
    // instead of a 0-damage roll.
    if (effectiveness === 0)
      return {
        noDamage: true as const,
        label: `${formatName(defender.name)} is immune to ${formatName(move.type)} moves - no effect.`,
      };

    const stab = attacker.types.includes(move.type);

    const wm = weatherMult(move.type);
    const tm = terrainMult(move.type);

    function calc(isCritical: boolean) {
      const itemMult = attackItemMult(effectiveness, isSpecial, move.type);
      return calculateDamage({
        level: attLevel,
        power: move.power,
        attack: atk,
        defense: isCritical
          ? baseEffectiveDef
          : Math.floor(baseEffectiveDef * envDefMult),
        stab,
        typeEffectiveness: effectiveness,
        isCritical,
        modifiers: [itemMult, wm, tm],
      });
    }

    const { min, max } = calc(crit);
    const critRange = crit ? null : calc(true);
    const ko = estimateKO(min, max, hp);

    const conditions: string[] = [];
    if (weather)
      conditions.push(
        WEATHER_OPTIONS.find((o) => o.value === weather)?.label ?? weather,
      );
    if (terrain)
      conditions.push(
        TERRAIN_OPTIONS.find((o) => o.value === terrain)?.label ?? terrain,
      );
    if (crit) conditions.push("Critical hit");
    if (roll !== "random")
      conditions.push(roll === "min" ? "Min roll" : "Max roll");

    return {
      min,
      max,
      minPct: Math.round((min / hp) * 100),
      maxPct: Math.round((max / hp) * 100),
      effectiveness,
      effLabel: effectivenessLabel(effectiveness),
      stab,
      isSpecial,
      atk,
      def: Math.floor(baseEffectiveDef * envDefMult),
      hp,
      ko,
      critRange,
      conditions,
      noDamage: false as const,
    };
  }

  let damageResult = $derived(selectedMove ? computeMove(selectedMove) : null);

  /** Level-up moves narrowed by the move-filter input (name substring). */
  let filteredMoveList = $derived.by(() => {
    const ml = moveList;
    if (!ml) return [];
    const q = moveFilter.trim().toLowerCase();
    return q ? ml.level_up.filter((m) => m.name.includes(q)) : ml.level_up;
  });

  let bestMoves = $derived.by(() => {
    if (!attacker || !defender || !moveList) return [];
    return moveList.level_up
      .map((m) => ({ move: m, result: computeMove(m) }))
      .filter(
        (
          x,
        ): x is {
          move: MoveInfo;
          result: Extract<DamageResult, { noDamage: false }>;
        } =>
          !!x.result &&
          !x.result.noDamage &&
          // Moves that compute to zero damage (floor rounding at extreme
          // level gaps); exclude them and keep the bar denominator > 0.
          x.result.max > 0,
      )
      .sort((a, b) => b.result.max - a.result.max)
      .slice(0, 5);
  });
</script>

{#snippet bestMovesList(
  footer = "Click a move to apply it to the calculation above.",
)}
  <h2 {...stylex.attrs(styles.bestMovesTitle)}>
    Best moves vs {formatName(defender!.name)}
  </h2>
  <div {...stylex.attrs(styles.bestMovesList)}>
    {#each bestMoves as { move, result }}
      <button
        onclick={() => pickMove(move)}
        {...stylex.attrs(
          styles.bestMoveButton,
          selectedMove?.name === move.name
            ? styles.bestMoveSelected
            : styles.bestMoveIdle,
        )}
      >
        <TypeBadge type={move.type} size="xs" tooltip={false} />
        <span {...stylex.attrs(styles.bestMoveName)}
          >{formatName(move.name)}</span
        >
        <span {...stylex.attrs(styles.bestMoveRange)}
          >{result.min}–{result.max}</span
        >
        <div {...stylex.attrs(styles.bestMoveTrack)}>
          <div
            {...stylex.attrs(
              styles.bestMoveFill,
              dynamic.width(`${(result.max / bestMoves[0].result.max) * 100}%`),
            )}
          ></div>
        </div>
        <span {...stylex.attrs(styles.koBadge)}>{result.ko}</span>
      </button>
    {/each}
  </div>
  {#if footer}
    <p {...stylex.attrs(styles.bestMovesFooter)}>{footer}</p>
  {/if}
{/snippet}

{#snippet selectedCard(p: PokemonDetail)}
  <a
    href={resolve(`/pokemon/${p.name}`)}
    {...stylex.attrs(styles.selectedCard)}
  >
    <PokemonImage
      src={p.sprites.other["official-artwork"].front_default}
      id={p.id}
      alt={p.name}
      sx={styles.selectedCardImage}
    />
    <div>
      <div {...stylex.attrs(styles.selectedCardName)}>
        {formatName(p.name)}
      </div>
      <div {...stylex.attrs(styles.selectedCardTypes)}>
        {#each p.types as t}<TypeBadge type={t} size="xs" />{/each}
      </div>
    </div>
  </a>
{/snippet}

<div {...stylex.attrs(shared.toolShell, styles.shell)}>
  <div {...stylex.attrs(shared.toolHero)}>
    <div {...stylex.attrs(styles.heroRow)}>
      <div>
        <h1 {...stylex.attrs(shared.toolHeroTitle)}>Damage Calculator</h1>
        <p {...stylex.attrs(shared.toolHeroText)}>
          Attacker + move + defender with natures, EVs, IVs, items, STAB, type
          effectiveness, KO estimates, and best-move suggestions. Shareable via
          query params.
        </p>
      </div>
      <ClearButton onclick={clearState} />
    </div>
  </div>

  <div {...stylex.attrs(styles.attackerDefenderGrid)}>
    <div {...stylex.attrs(shared.panel)}>
      <h2 {...stylex.attrs(styles.panelTitle)}>Attacker</h2>
      <PokemonSearch
        bind:value={searchAtt}
        options={allNames}
        onselect={(n) => selectAttacker(n)}
      />
      {#if loadingAtt}<div {...stylex.attrs(styles.loadingWrap)}>
          <Pokeball spinning sx={styles.pokeballSm} />
        </div>{/if}
      {#if attError}<p {...stylex.attrs(styles.errorText)} role="alert">
          {attError}
        </p>{/if}
      {#if attacker}
        {@render selectedCard(attacker)}
        {#if moveList}
          <div {...stylex.attrs(styles.levelRow)}>
            <span {...stylex.attrs(styles.levelLabel)}>Level</span>
            <input
              type="number"
              bind:value={attLevel}
              onchange={syncUrl}
              min={1}
              max={100}
              aria-label="Attacker level"
              {...stylex.attrs(styles.levelInput)}
            />
          </div>
          <div {...stylex.attrs(styles.natureItemGrid)}>
            <Dropdown
              selected={attNature}
              onselect={(n) => {
                attNature = n;
                syncUrl();
              }}
              onclear={() => {
                attNature = "";
                syncUrl();
              }}
              placeholder="Neutral nature"
              options={NATURE_OPTIONS}
            />
            <Dropdown
              selected={attItem}
              onselect={(label) => {
                attItem = label;
                syncUrl();
              }}
              onclear={() => {
                attItem = "";
                syncUrl();
              }}
              placeholder="No item"
              options={ATTACK_ITEMS.map((i) => ({ value: i.label }))}
            />
          </div>
          <div {...stylex.attrs(styles.evWrap)}>
            <EVInput
              evs={attEvs}
              oninput={setAttEv}
              iv={attIv}
              onIvInput={(v) => (attIv = v)}
              onIvChange={syncUrl}
            />
          </div>
          <div {...stylex.attrs(styles.moveFilterWrap)}>
            <input
              type="search"
              bind:value={moveFilter}
              placeholder="Filter moves..."
              aria-label="Filter attacker's moves"
              {...stylex.attrs(styles.moveFilter)}
            />
          </div>
          <div {...stylex.attrs(styles.moveGrid)}>
            {#each filteredMoveList as m}
              <MoveTooltip move={m}>
                {#snippet children()}
                  <button
                    onclick={() => pickMove(m)}
                    {...stylex.attrs(
                      styles.moveButton,
                      selectedMove?.name === m.name
                        ? styles.moveButtonSelected
                        : styles.moveButtonIdle,
                    )}
                  >
                    <TypeBadge type={m.type} size="xs" tooltip={false} />
                    <span {...stylex.attrs(styles.moveName)}
                      >{formatName(m.name)}</span
                    >
                    <span {...stylex.attrs(styles.movePower)}
                      >{m.power ?? "—"}</span
                    >
                  </button>
                {/snippet}
              </MoveTooltip>
            {/each}
          </div>
        {/if}
      {/if}
    </div>

    <div {...stylex.attrs(shared.panel)}>
      <h2 {...stylex.attrs(styles.panelTitle)}>Defender</h2>
      <PokemonSearch
        bind:value={searchDef}
        options={allNames}
        onselect={selectDefender}
      />
      {#if loadingDef}<div {...stylex.attrs(styles.loadingWrap)}>
          <Pokeball spinning sx={styles.pokeballSm} />
        </div>{/if}
      {#if defError}<p {...stylex.attrs(styles.errorText)} role="alert">
          {defError}
        </p>{/if}
      {#if defender}
        {@render selectedCard(defender)}
        <div {...stylex.attrs(styles.levelRowDef)}>
          <span {...stylex.attrs(styles.levelLabel)}>Level</span>
          <input
            type="number"
            bind:value={defLevel}
            onchange={syncUrl}
            min={1}
            max={100}
            aria-label="Defender level"
            {...stylex.attrs(styles.levelInput)}
          />
        </div>
        <div {...stylex.attrs(styles.dropdownWide)}>
          <Dropdown
            selected={defItem}
            onselect={(label) => {
              defItem = label;
              syncUrl();
            }}
            onclear={() => {
              defItem = "";
              syncUrl();
            }}
            placeholder="No item"
            options={DEFENSE_ITEMS.map((i) => ({ value: i.label }))}
          />
        </div>
        <div {...stylex.attrs(styles.dropdownMax)}>
          <Dropdown
            selected={defNature}
            onselect={(n) => {
              defNature = n;
              syncUrl();
            }}
            onclear={() => {
              defNature = "";
              syncUrl();
            }}
            placeholder="Neutral nature (defender)"
            options={NATURE_OPTIONS}
          />
        </div>
        <div {...stylex.attrs(styles.evWrap)}>
          <EVInput
            evs={defEvs}
            oninput={setDefEv}
            iv={defIv}
            onIvInput={(v) => (defIv = v)}
            onIvChange={syncUrl}
            label="Defender EVs"
            stats={EV_STATS.filter(
              (s) => s.key === "hp" || s.key === "def" || s.key === "spd",
            )}
            cols={3}
          />
        </div>
        {@const defHp = statValue(baseStat(defender, "hp"), defLevel, {
          iv: defIv,
          ev: defEvs.hp,
          hp: true,
        })}
        {@const defDef = statValue(baseStat(defender, "defense"), defLevel, {
          iv: defIv,
          ev: defEvs.def,
        })}
        {@const defSpd = statValue(
          baseStat(defender, "special-defense"),
          defLevel,
          { iv: defIv, ev: defEvs.spd },
        )}
        <div {...stylex.attrs(styles.statGrid)}>
          <div {...stylex.attrs(styles.statTile)}>
            <div {...stylex.attrs(styles.statLabel)}>HP</div>
            <div {...stylex.attrs(styles.statValue)}>{defHp}</div>
          </div>
          <div {...stylex.attrs(styles.statTile)}>
            <div {...stylex.attrs(styles.statLabel)}>Defense</div>
            <div {...stylex.attrs(styles.statValue)}>{defDef}</div>
          </div>
          <div {...stylex.attrs(styles.statTile)}>
            <div {...stylex.attrs(styles.statLabel)}>Sp. Def</div>
            <div {...stylex.attrs(styles.statValue)}>{defSpd}</div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  {#if attacker && defender}
    <div {...stylex.attrs(shared.panel, styles.panelMb6)}>
      <h2 {...stylex.attrs(styles.panelTitle)}>Conditions</h2>
      <div {...stylex.attrs(styles.conditionsRow)}>
        <Dropdown
          sx={styles.ddW36}
          selected={weather}
          onselect={(w) => {
            weather = w;
            syncUrl();
          }}
          onclear={() => {
            weather = "";
            syncUrl();
          }}
          placeholder="No weather"
          options={WEATHER_OPTIONS}
        />
        <Dropdown
          sx={styles.ddW44}
          selected={terrain}
          onselect={(t) => {
            terrain = t;
            syncUrl();
          }}
          onclear={() => {
            terrain = "";
            syncUrl();
          }}
          placeholder="No terrain"
          options={TERRAIN_OPTIONS}
        />
        <Dropdown
          sx={styles.ddW52}
          selected={roll}
          onselect={(r) => {
            roll = r as typeof roll;
            syncUrl();
          }}
          onclear={() => {
            roll = "random";
            syncUrl();
          }}
          placeholder="Random roll"
          options={ROLL_OPTIONS}
        />
        <label {...stylex.attrs(styles.critLabel)}>
          <input
            type="checkbox"
            checked={crit}
            onchange={(e) => {
              crit = e.currentTarget.checked;
              syncUrl();
            }}
            {...stylex.attrs(styles.critCheckbox)}
          />
          Critical hit (×1.5)
        </label>
      </div>
      {#if damageResult && !damageResult.noDamage && damageResult.conditions.length > 0}
        <p {...stylex.attrs(styles.conditionsNote)}>
          Conditions: {damageResult.conditions.join(" · ")}
        </p>
      {/if}
    </div>
  {/if}

  {#if !attacker || !defender}
    <EmptyState
      title="Set up a calculation"
      subtitle="Choose attacker, a damaging move, and a defender to see damage ranges."
    />
  {:else if !selectedMove}
    {#if moveList === null && !movesError}
      <div {...stylex.attrs(shared.panel, styles.loadingPanel)}>
        <Pokeball spinning sx={styles.pokeballMd} />
      </div>
    {:else if movesError}
      <div {...stylex.attrs(shared.panel, styles.errorPanel)}>
        <p {...stylex.attrs(styles.errorMessage)}>
          Couldn't load {formatName(attacker.name)}'s moves — check your
          connection.
        </p>
        <button
          onclick={() => attacker && selectAttacker(attacker.name)}
          {...stylex.attrs(styles.retryButton)}>Try again</button
        >
      </div>
    {:else if bestMoves.length > 0}
      <div {...stylex.attrs(shared.panel)}>
        <p {...stylex.attrs(styles.prompt)}>
          Pick a damaging move to see the damage calculation — or click a
          suggestion below.
        </p>
        {@render bestMovesList("")}
      </div>
    {:else}
      <div {...stylex.attrs(shared.panel, styles.noMovesPanel)}>
        No damaging moves available for {formatName(attacker.name)} against{" "}
        {formatName(defender.name)}.
      </div>
    {/if}
  {:else if damageResult?.noDamage}
    <div {...stylex.attrs(shared.panel, styles.noDamagePanel)}>
      {damageResult.label}
    </div>
  {:else if damageResult && !damageResult.noDamage}
    <div {...stylex.attrs(shared.panel)}>
      <div {...stylex.attrs(styles.resultHeader)}>
        <h2 {...stylex.attrs(styles.resultTitle)}>Result</h2>
        <span {...stylex.attrs(styles.resultKoBadge)}>{damageResult.ko}</span>
      </div>

      <div {...stylex.attrs(styles.resultBody)}>
        <div {...stylex.attrs(styles.hpLabels)}>
          <span>HP damage</span>
          <span>{damageResult.minPct}% – {damageResult.maxPct}%</span>
        </div>
        <div {...stylex.attrs(styles.hpTrack)}>
          <div
            {...stylex.attrs(
              styles.hpFillMax,
              dynamic.width(`${Math.min(100, damageResult.maxPct)}%`),
            )}
          ></div>
          <div
            {...stylex.attrs(
              styles.hpFillMin,
              dynamic.width(`${Math.min(100, damageResult.minPct)}%`),
            )}
          ></div>
        </div>
        <div {...stylex.attrs(styles.damageTotal)}>
          {roll === "max"
            ? damageResult.max
            : roll === "min"
              ? damageResult.min
              : `${damageResult.min} – ${damageResult.max}`}
          <span {...stylex.attrs(styles.damageHp)}>/ {damageResult.hp} HP</span>
        </div>
        {#if damageResult.critRange && !crit}
          <p {...stylex.attrs(styles.critRange)}>
            With a critical hit: {damageResult.critRange.min} – {damageResult
              .critRange.max}
          </p>
        {/if}
      </div>

      <div {...stylex.attrs(styles.resultStats)}>
        <div {...stylex.attrs(styles.resultStatTile)}>
          <div {...stylex.attrs(styles.resultStatLabel)}>Effectiveness</div>
          <div
            {...stylex.attrs(
              styles.resultStatValue,
              dynamic.color(
                (damageResult.effectiveness ?? 1) >= 2
                  ? "#ff3e3e"
                  : (damageResult.effectiveness ?? 1) < 1
                    ? "#4ade80"
                    : "#fff",
              ),
            )}
          >
            {damageResult.effLabel}
          </div>
        </div>
        <div {...stylex.attrs(styles.resultStatTile)}>
          <div {...stylex.attrs(styles.resultStatLabel)}>STAB</div>
          <div
            {...stylex.attrs(
              styles.resultStatValue,
              dynamic.color(damageResult.stab ? "#4ade80" : "#fff"),
            )}
          >
            {damageResult.stab ? "Yes (+50%)" : "No"}
          </div>
        </div>
        <div {...stylex.attrs(styles.resultStatTile)}>
          <div {...stylex.attrs(styles.resultStatLabel)}>
            {damageResult.isSpecial ? "SpA / SpD" : "Atk / Def"}
          </div>
          <div {...stylex.attrs(styles.resultStatValue)}>
            {damageResult.atk} / {damageResult.def}
          </div>
        </div>
      </div>

      {#if bestMoves.length > 0}
        <div {...stylex.attrs(styles.resultBestMoves)}>
          {@render bestMovesList()}
        </div>
      {/if}
    </div>
  {/if}

  {#if bestMoves.length > 0 && damageResult?.noDamage}
    <div {...stylex.attrs(shared.panel, styles.panelMt6)}>
      {@render bestMovesList()}
    </div>
  {/if}
</div>
