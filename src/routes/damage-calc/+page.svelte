<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import {
    getPokemonDetail,
    getAutocompleteList,
    getPokemonMoves,
  } from "$lib/api";
  import {
    TYPE_COLORS,
    TYPE_CHART,
    calculateDamage,
    formatName,
    type PokemonDetail,
    type PokemonMoves,
  } from "$lib/pokemon-types";
  import PokemonPicker from "$lib/components/PokemonPicker.svelte";
  import TypeBadge from "$lib/components/TypeBadge.svelte";
  import MoveTooltip from "$lib/components/MoveTooltip.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import { onMount } from "svelte";

  let allNames: { name: string; id: number }[] = $state([]);
  let attacker = $state<PokemonDetail | null>(null);
  let defender = $state<PokemonDetail | null>(null);
  let moveList = $state<PokemonMoves | null>(null);
  let searchAtt = $state("");
  let searchDef = $state("");
  let selectedMove = $state<any>(null);
  let attLevel = $state(50);
  let defLevel = $state(50);
  let loadingAtt = $state(false);
  let loadingDef = $state(false);
  let effectGen = 0;

  onMount(async () => {
    try {
      const catalog = await getAutocompleteList();
      allNames = catalog.results;
    } catch {}
  });

  $effect(() => {
    const gen = ++effectGen;
    const att = page.url.searchParams.get("att");
    const def = page.url.searchParams.get("def");
    const mv = page.url.searchParams.get("move");
    const al = page.url.searchParams.get("al");
    const dl = page.url.searchParams.get("dl");
    if (al) attLevel = Math.min(100, Math.max(1, parseInt(al, 10) || 50));
    else attLevel = 50;
    if (dl) defLevel = Math.min(100, Math.max(1, parseInt(dl, 10) || 50));
    else defLevel = 50;
    if (!att && !def) {
      attacker = null;
      defender = null;
      searchAtt = "";
      searchDef = "";
      selectedMove = null;
      moveList = null;
      return;
    }
    (async () => {
      if (att && attacker?.name !== att)
        await selectAttacker(att, mv, gen, true);
      if (def && defender?.name !== def) await selectDefender(def, gen, true);
    })();
  });

  function syncUrl() {
    const params = new URLSearchParams();
    if (attacker) params.set("att", attacker.name);
    if (defender) params.set("def", defender.name);
    if (selectedMove) params.set("move", selectedMove.name);
    if (attLevel !== 50) params.set("al", String(attLevel));
    if (defLevel !== 50) params.set("dl", String(defLevel));
    const q = params.toString();
    goto(q ? resolve("/damage-calc") + `?${q}` : resolve("/damage-calc"), {
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
  }

  function clearState() {
    localStorage.removeItem(`pageState:${page.url.pathname}`);
    goto(resolve("/damage-calc"), { replaceState: true });
  }

  async function selectAttacker(
    name: string,
    preferMove?: string | null,
    gen?: number,
    skipSync?: boolean,
  ) {
    searchAtt = name;
    loadingAtt = true;
    try {
      const p = await getPokemonDetail(name);
      if (gen !== undefined && gen !== effectGen) return;
      attacker = p;
      selectedMove = null;
      moveList = null;
      moveList = await getPokemonMoves(name);
      if (preferMove && moveList) {
        selectedMove =
          moveList.level_up.find((m) => m.name === preferMove) ?? null;
      }
      if (!skipSync) syncUrl();
    } catch {
    } finally {
      loadingAtt = false;
    }
  }

  async function selectDefender(
    name: string,
    gen?: number,
    skipSync?: boolean,
  ) {
    searchDef = name;
    loadingDef = true;
    try {
      const p = await getPokemonDetail(name);
      if (gen !== undefined && gen !== effectGen) return;
      defender = p;
      if (!skipSync) syncUrl();
    } catch {
    } finally {
      loadingDef = false;
    }
  }

  function pickMove(m: any) {
    selectedMove = m;
    syncUrl();
  }

  function statValue(base: number, level: number, hp = false) {
    return hp
      ? Math.floor(((2 * base + 31) * level) / 100) + level + 10
      : Math.floor(((2 * base + 31) * level) / 100 + 5);
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
    if (effectiveness === 0.25) return "Not very effective (¼×)";
    if (effectiveness === 0.5) return "Not very effective (½×)";
    if (effectiveness === 2) return "Super effective (2×)";
    if (effectiveness === 4) return "Super effective (4×)";
    return "Normal (1×)";
  }

  let damageResult = $derived.by(() => {
    if (!attacker || !defender || !selectedMove) return null;
    const move = selectedMove;
    if (!move.power)
      return {
        noDamage: true as const,
        label: "This move deals no direct damage.",
      };

    const isSpecial = move.damage_class === "special";
    const baseAtk = isSpecial
      ? (attacker.stats.find((s) => s.name === "special-attack")?.base_stat ??
        0)
      : (attacker.stats.find((s) => s.name === "attack")?.base_stat ?? 0);
    const baseDef = isSpecial
      ? (defender.stats.find((s) => s.name === "special-defense")?.base_stat ??
        0)
      : (defender.stats.find((s) => s.name === "defense")?.base_stat ?? 0);
    const baseHp = defender.stats.find((s) => s.name === "hp")?.base_stat ?? 0;

    const atk = statValue(baseAtk, attLevel);
    const def = statValue(baseDef, defLevel);
    const hp = statValue(baseHp, defLevel, true);

    let effectiveness = 1;
    for (const dt of defender.types) {
      const mult = TYPE_CHART[move.type]?.[dt];
      if (mult !== undefined) effectiveness *= mult;
    }

    const stab = attacker.types.includes(move.type);

    const { min, max } = calculateDamage({
      level: attLevel,
      power: move.power,
      attack: atk,
      defense: def,
      stab,
      typeEffectiveness: effectiveness,
      isCritical: false,
    });

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
      def,
      hp,
      ko: estimateKO(min, max, hp),
      noDamage: false as const,
    };
  });
</script>

<div class="tool-shell max-w-5xl">
  <div class="tool-hero">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1>Damage Calculator</h1>
        <p>
          Attacker + move + defender with STAB, type effectiveness, % HP, and KO
          estimate. Shareable via query params.
        </p>
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

  <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
    <div class="panel">
      <h2 class="mb-3 text-xs font-bold tracking-wider text-white/40 uppercase">
        Attacker
      </h2>
      <PokemonPicker
        bind:value={searchAtt}
        options={allNames}
        onselect={(n) => selectAttacker(n)}
      />
      {#if loadingAtt}<div class="mt-2">
          <LoadingSpinner size="sm" />
        </div>{/if}
      {#if attacker}
        <a
          href={resolve(`/pokemon/${attacker.name}`)}
          class="mt-4 flex items-center gap-3 rounded-xl bg-white/2 p-3 no-underline transition-colors hover:bg-white/5"
        >
          <img
            src={attacker.sprites.other["official-artwork"].front_default}
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
              class="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs outline-none"
            />
          </div>
          <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {#each moveList.level_up as m}
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
      <PokemonPicker
        bind:value={searchDef}
        options={allNames}
        onselect={selectDefender}
      />
      {#if loadingDef}<div class="mt-2">
          <LoadingSpinner size="sm" />
        </div>{/if}
      {#if defender}
        <a
          href={resolve(`/pokemon/${defender.name}`)}
          class="mt-4 flex items-center gap-3 rounded-xl bg-white/2 p-3 no-underline transition-colors hover:bg-white/5"
        >
          <img
            src={defender.sprites.other["official-artwork"].front_default}
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
            class="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs outline-none"
          />
        </div>
        {@const defHp = statValue(
          defender.stats.find((s) => s.name === "hp")?.base_stat ?? 0,
          defLevel,
          true,
        )}
        {@const defDef = statValue(
          defender.stats.find((s) => s.name === "defense")?.base_stat ?? 0,
          defLevel,
        )}
        {@const defSpd = statValue(
          defender.stats.find((s) => s.name === "special-defense")?.base_stat ??
            0,
          defLevel,
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

  {#if !attacker || !defender || !selectedMove}
    <EmptyState
      title="Set up a calculation"
      subtitle="Choose attacker, a damaging move, and a defender to see damage ranges."
    />
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
    </div>
  {/if}
</div>
