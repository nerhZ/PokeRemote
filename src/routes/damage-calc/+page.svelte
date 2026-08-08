<script lang="ts">
  import { page } from "$app/state";
  import { resolve } from "$app/paths";
  import { getPokemonMoves, getAutocompleteList } from "$lib/api";
  import { pageUrlSync, selectPokemonSlot } from "$lib/url-state";
  import {
    TYPE_COLORS,
    TYPE_CHART,
    NATURES,
    NATURES_MODIFIERS,
    NATURE_STAT_MODS,
    calculateDamage,
    formatName,
    multiplierLabel,
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
  import { onMount, untrack } from "svelte";

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
    if (Number.isNaN(v)) return fallback;
    return Math.min(max, Math.max(min, v));
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

  function statValue(
    base: number,
    level: number,
    opts: {
      iv?: number;
      ev?: number;
      hp?: boolean;
      nature?: { up: string | null; down: string | null } | null;
      statKey?: string;
    } = {},
  ) {
    const { iv = 31, ev = 0, hp = false, nature = null, statKey = "" } = opts;
    const evQuotient = Math.floor(ev / 4);
    let value = hp
      ? Math.floor(((2 * base + iv + evQuotient) * level) / 100) + level + 10
      : Math.floor(((2 * base + iv + evQuotient) * level) / 100 + 5);
    if (nature && statKey) {
      if (nature.up === statKey) value = Math.floor(value * 1.1);
      else if (nature.down === statKey) value = Math.floor(value * 0.9);
    }
    return value;
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
    if (!item) return 1;
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
      };

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
    const baseAtk =
      attacker.stats.find((s) => s.name === atkKey)?.base_stat ?? 0;
    const baseDef =
      defender.stats.find((s) => s.name === defKey)?.base_stat ?? 0;
    const baseHp = defender.stats.find((s) => s.name === "hp")?.base_stat ?? 0;

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
    const def = statValue(baseDef, defLevel, {
      iv: defIv,
      ev: defEv,
      nature: null,
    });
    const hp = statValue(baseHp, defLevel, {
      iv: defIv,
      ev: hpEv,
      hp: true,
      nature: null,
    });

    let effectiveness = 1;
    for (const dt of defender.types) {
      const mult = TYPE_CHART[move.type]?.[dt];
      if (mult !== undefined) effectiveness *= mult;
    }

    const stab = attacker.types.includes(move.type);

    let { min, max } = calculateDamage({
      level: attLevel,
      power: move.power,
      attack: atk,
      defense: Math.floor(def * defenseItemMult(isSpecial)),
      stab,
      typeEffectiveness: effectiveness,
      isCritical: false,
    });
    const itemMult = attackItemMult(effectiveness, isSpecial, move.type);
    min = Math.floor(min * itemMult);
    max = Math.floor(max * itemMult);

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
      def: Math.floor(def * defenseItemMult(isSpecial)),
      hp,
      ko: estimateKO(min, max, hp),
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
          // Moves that compute to zero damage (type immunity, or floor
          // rounding at extreme level gaps) — exclude them, and keep the bar
          // denominator > 0.
          x.result.max > 0,
      )
      .sort((a, b) => b.result.max - a.result.max)
      .slice(0, 5);
  });
</script>

{#snippet bestMovesList(
  footer = "Click a move to apply it to the calculation above.",
)}
  <h2 class="mb-4 text-lg font-bold">
    Best moves vs {formatName(defender!.name)}
  </h2>
  <div class="space-y-2">
    {#each bestMoves as { move, result }}
      <button
        onclick={() => pickMove(move)}
        class="flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors {selectedMove?.name ===
        move.name
          ? 'border-accent bg-accent/10'
          : 'border-white/6 bg-white/2 hover:bg-white/5'}"
      >
        <TypeBadge type={move.type} size="xs" tooltip={false} />
        <span class="w-36 shrink-0 truncate font-semibold text-white/80"
          >{formatName(move.name)}</span
        >
        <span class="shrink-0 text-xs text-white/40"
          >{result.min}–{result.max}</span
        >
        <div
          class="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/6"
        >
          <div
            class="bg-accent/50 absolute inset-y-0 left-0 rounded-full"
            style="width: {(result.max / bestMoves[0].result.max) * 100}%"
          ></div>
        </div>
        <span
          class="bg-accent/20 text-accent border-accent/30 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black whitespace-nowrap uppercase"
          >{result.ko}</span
        >
      </button>
    {/each}
  </div>
  {#if footer}
    <p class="mt-3 text-xs text-white/40">{footer}</p>
  {/if}
{/snippet}

<div class="tool-shell max-w-5xl">
  <div class="tool-hero">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1>Damage Calculator</h1>
        <p>
          Attacker + move + defender with natures, EVs, IVs, items, STAB, type
          effectiveness, KO estimates, and best-move suggestions. Shareable via
          query params.
        </p>
      </div>
      <ClearButton onclick={clearState} />
    </div>
  </div>

  <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
    <div class="panel">
      <h2 class="mb-3 text-xs font-bold tracking-wider text-white/40 uppercase">
        Attacker
      </h2>
      <PokemonSearch
        bind:value={searchAtt}
        options={allNames}
        onselect={(n) => selectAttacker(n)}
      />
      {#if loadingAtt}<div class="mt-2 flex justify-center">
          <Pokeball spinning class="h-6 w-6" />
        </div>{/if}
      {#if attError}<p class="text-pokemon-red mt-2 text-xs" role="alert">
          {attError}
        </p>{/if}
      {#if attacker}
        <a
          href={resolve(`/pokemon/${attacker.name}`)}
          class="mt-4 flex items-center gap-3 rounded-xl bg-white/2 p-3 no-underline transition-colors hover:bg-white/5"
        >
          <PokemonImage
            src={attacker.sprites.other["official-artwork"].front_default}
            id={attacker.id}
            alt={attacker.name}
            class="h-14 w-14 object-contain"
          />
          <div>
            <div class="text-sm font-bold" style="color: var(--text)">
              {formatName(attacker.name)}
            </div>
            <div class="mt-1 flex gap-1">
              {#each attacker.types as t}<TypeBadge type={t} size="xs" />{/each}
            </div>
          </div>
        </a>
        {#if moveList}
          <div class="mt-4 mb-2 flex items-center gap-2">
            <span class="text-xs text-white/40">Level</span>
            <input
              type="number"
              bind:value={attLevel}
              onchange={syncUrl}
              min={1}
              max={100}
              aria-label="Attacker level"
              class="focus:border-accent/50 w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs outline-none"
            />
          </div>
          <div class="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
              options={NATURES.map((n) => ({
                value: n,
                meta: NATURES_MODIFIERS[n],
              }))}
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
          <div class="mb-3">
            <EVInput
              evs={attEvs}
              oninput={setAttEv}
              iv={attIv}
              onIvInput={(v) => (attIv = v)}
              onIvChange={syncUrl}
            />
          </div>
          <div class="mb-2">
            <input
              type="search"
              bind:value={moveFilter}
              placeholder="Filter moves..."
              aria-label="Filter attacker's moves"
              class="focus:border-accent/50 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 placeholder-white/30 outline-none"
            />
          </div>
          <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {#each filteredMoveList as m}
              <MoveTooltip move={m}>
                {#snippet children()}
                  <button
                    onclick={() => pickMove(m)}
                    class="flex w-full cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left text-xs {selectedMove?.name ===
                    m.name
                      ? 'border-accent bg-accent/10 text-white'
                      : 'border-white/4 bg-white/2 text-white/60'}"
                  >
                    <TypeBadge type={m.type} size="xs" tooltip={false} />
                    <span class="flex-1 truncate">{formatName(m.name)}</span>
                    <span class="text-white/30">{m.power ?? "—"}</span>
                  </button>
                {/snippet}
              </MoveTooltip>
            {/each}
          </div>
        {/if}
      {/if}
    </div>

    <div class="panel">
      <h2 class="mb-3 text-xs font-bold tracking-wider text-white/40 uppercase">
        Defender
      </h2>
      <PokemonSearch
        bind:value={searchDef}
        options={allNames}
        onselect={selectDefender}
      />
      {#if loadingDef}<div class="mt-2 flex justify-center">
          <Pokeball spinning class="h-6 w-6" />
        </div>{/if}
      {#if defError}<p class="text-pokemon-red mt-2 text-xs" role="alert">
          {defError}
        </p>{/if}
      {#if defender}
        <a
          href={resolve(`/pokemon/${defender.name}`)}
          class="mt-4 flex items-center gap-3 rounded-xl bg-white/2 p-3 no-underline transition-colors hover:bg-white/5"
        >
          <PokemonImage
            src={defender.sprites.other["official-artwork"].front_default}
            id={defender.id}
            alt={defender.name}
            class="h-14 w-14 object-contain"
          />
          <div>
            <div class="text-sm font-bold" style="color: var(--text)">
              {formatName(defender.name)}
            </div>
            <div class="mt-1 flex gap-1">
              {#each defender.types as t}<TypeBadge type={t} size="xs" />{/each}
            </div>
          </div>
        </a>
        <div class="mt-3 flex items-center gap-2">
          <span class="text-xs text-white/40">Level</span>
          <input
            type="number"
            bind:value={defLevel}
            onchange={syncUrl}
            min={1}
            max={100}
            aria-label="Defender level"
            class="focus:border-accent/50 w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs outline-none"
          />
        </div>
        <div class="mt-3 mb-3 max-w-xs">
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
        <div class="mb-3">
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
            cols="grid-cols-3"
          />
        </div>
        {@const defHp = statValue(
          defender.stats.find((s) => s.name === "hp")?.base_stat ?? 0,
          defLevel,
          { iv: defIv, ev: defEvs.hp, hp: true },
        )}
        {@const defDef = statValue(
          defender.stats.find((s) => s.name === "defense")?.base_stat ?? 0,
          defLevel,
          { iv: defIv, ev: defEvs.def },
        )}
        {@const defSpd = statValue(
          defender.stats.find((s) => s.name === "special-defense")?.base_stat ??
            0,
          defLevel,
          { iv: defIv, ev: defEvs.spd },
        )}
        <div class="mt-3 grid grid-cols-3 gap-1.5 text-center">
          <div class="rounded-lg bg-white/3 px-2 py-1.5">
            <div class="text-[10px] text-white/40">HP</div>
            <div class="text-xs font-bold">{defHp}</div>
          </div>
          <div class="rounded-lg bg-white/3 px-2 py-1.5">
            <div class="text-[10px] text-white/40">Defense</div>
            <div class="text-xs font-bold">{defDef}</div>
          </div>
          <div class="rounded-lg bg-white/3 px-2 py-1.5">
            <div class="text-[10px] text-white/40">Sp. Def</div>
            <div class="text-xs font-bold">{defSpd}</div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  {#if !attacker || !defender}
    <EmptyState
      title="Set up a calculation"
      subtitle="Choose attacker, a damaging move, and a defender to see damage ranges."
    />
  {:else if !selectedMove}
    {#if moveList === null && !movesError}
      <div class="panel flex justify-center py-8">
        <Pokeball spinning class="h-8 w-8" />
      </div>
    {:else if movesError}
      <div class="panel py-8 text-center">
        <p class="text-sm" style="color: var(--muted)">
          Couldn't load {formatName(attacker.name)}'s moves — check your
          connection.
        </p>
        <button
          onclick={() => attacker && selectAttacker(attacker.name)}
          class="bg-accent hover:bg-accent/80 mt-4 cursor-pointer rounded-xl border-0 px-4 py-2 text-xs font-semibold text-white"
          >Try again</button
        >
      </div>
    {:else if bestMoves.length > 0}
      <div class="panel">
        <p
          class="mb-4 rounded-xl border border-white/6 bg-white/2 p-3 text-xs text-white/50"
        >
          Pick a damaging move to see the damage calculation — or click a
          suggestion below.
        </p>
        {@render bestMovesList("")}
      </div>
    {:else}
      <div class="panel py-8 text-center text-sm text-white/40">
        No damaging moves available for {formatName(attacker.name)} against{" "}
        {formatName(defender.name)}.
      </div>
    {/if}
  {:else if damageResult?.noDamage}
    <div class="panel text-center text-white/50">{damageResult.label}</div>
  {:else if damageResult && !damageResult.noDamage}
    <div class="panel">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-xl font-bold">Result</h2>
        <span
          class="bg-accent/20 text-accent border-accent/30 rounded-full border px-3 py-1.5 text-xs font-black tracking-wide uppercase"
          >{damageResult.ko}</span
        >
      </div>

      <div class="mb-6">
        <div class="mb-1 flex justify-between text-xs text-white/40">
          <span>HP damage</span>
          <span>{damageResult.minPct}% – {damageResult.maxPct}%</span>
        </div>
        <div class="relative h-4 overflow-hidden rounded-full bg-white/6">
          <div
            class="bg-accent/40 absolute inset-y-0 left-0 rounded-full"
            style="width: {Math.min(100, damageResult.maxPct)}%"
          ></div>
          <div
            class="bg-accent absolute inset-y-0 left-0 rounded-full"
            style="width: {Math.min(100, damageResult.minPct)}%"
          ></div>
        </div>
        <div class="mt-3 text-center text-2xl font-black">
          {damageResult.min} – {damageResult.max}
          <span class="text-sm font-normal text-white/40"
            >/ {damageResult.hp} HP</span
          >
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div
          class="rounded-2xl border border-white/4 bg-white/2 p-3 text-center"
        >
          <div class="text-[10px] text-white/40 uppercase">Effectiveness</div>
          <div
            class="mt-1 text-sm font-bold"
            style="color: {(damageResult.effectiveness ?? 1) >= 2
              ? '#ff3e3e'
              : (damageResult.effectiveness ?? 1) < 1
                ? '#4ade80'
                : '#fff'}"
          >
            {damageResult.effLabel}
          </div>
        </div>
        <div
          class="rounded-2xl border border-white/4 bg-white/2 p-3 text-center"
        >
          <div class="text-[10px] text-white/40 uppercase">STAB</div>
          <div
            class="mt-1 text-sm font-bold"
            style="color: {damageResult.stab ? '#4ade80' : '#fff'}"
          >
            {damageResult.stab ? "Yes (+50%)" : "No"}
          </div>
        </div>
        <div
          class="rounded-2xl border border-white/4 bg-white/2 p-3 text-center"
        >
          <div class="text-[10px] text-white/40 uppercase">
            {damageResult.isSpecial ? "SpA / SpD" : "Atk / Def"}
          </div>
          <div class="mt-1 text-sm font-bold">
            {damageResult.atk} / {damageResult.def}
          </div>
        </div>
      </div>

      {#if bestMoves.length > 0}
        <div class="mt-6 border-t border-white/6 pt-5">
          {@render bestMovesList()}
        </div>
      {/if}
    </div>
  {/if}

  {#if bestMoves.length > 0 && damageResult?.noDamage}
    <div class="panel mt-6">
      {@render bestMovesList()}
    </div>
  {/if}
</div>
