<script lang="ts">
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { getPokemonDetail, getAutocompleteList, getPokemonMoves } from "$lib/api";
    import { TYPE_COLORS, TYPE_CHART, calculateDamage, formatName, capitalize, type PokemonDetail, type PokemonMoves } from "$lib/pokemon-types";
    import PokemonPicker from "$lib/components/PokemonPicker.svelte";
    import TypeBadge from "$lib/components/TypeBadge.svelte";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import { onMount } from "svelte";

    let allNames: { name: string; id: number }[] = $state([]);
    let attacker = $state<PokemonDetail | null>(null);
    let defender = $state<PokemonDetail | null>(null);
    let moveList = $state<PokemonMoves | null>(null);
    let searchAtt = $state("");
    let searchDef = $state("");
    let selectedMove = $state<any>(null);
    let level = $state(50);
    let loadingAtt = $state(false);
    let loadingDef = $state(false);
    let effectGen = 0;

    onMount(async () => {
        try {
            const catalog = await getAutocompleteList({});
            allNames = catalog.results;
        } catch {}
    });

    $effect(() => {
        const gen = ++effectGen;
        const att = page.url.searchParams.get("att");
        const def = page.url.searchParams.get("def");
        const mv = page.url.searchParams.get("move");
        const lv = page.url.searchParams.get("lv");
        if (lv) level = Math.min(100, Math.max(1, parseInt(lv, 10) || 50));
        (async () => {
            if (att && attacker?.name !== att) await selectAttacker(att, mv, gen);
            if (def && defender?.name !== def) await selectDefender(def, gen);
        })();
    });

    function syncUrl() {
        const params = new URLSearchParams();
        if (attacker) params.set("att", attacker.name);
        if (defender) params.set("def", defender.name);
        if (selectedMove) params.set("move", selectedMove.name);
        if (level !== 50) params.set("lv", String(level));
        const q = params.toString();
        goto(q ? `${base}/damage-calc?${q}` : `${base}/damage-calc`, { replaceState: true, keepFocus: true, noScroll: true });
    }

    async function selectAttacker(name: string, preferMove?: string | null, gen?: number) {
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
                selectedMove = moveList.level_up.find((m) => m.name === preferMove) ?? null;
            }
            syncUrl();
        } catch {}
        finally {
            loadingAtt = false;
        }
    }

    async function selectDefender(name: string, gen?: number) {
        searchDef = name;
        loadingDef = true;
        try {
            const p = await getPokemonDetail(name);
            if (gen !== undefined && gen !== effectGen) return;
            defender = p;
            syncUrl();
        } catch {}
        finally {
            loadingDef = false;
        }
    }

    function pickMove(m: any) {
        selectedMove = m;
        syncUrl();
    }

    let damageResult = $derived.by(() => {
        if (!attacker || !defender || !selectedMove) return null;
        const move = selectedMove;
        if (!move.power) return { noDamage: true as const, label: "This move deals no direct damage." };

        const calcStat = (base: number, hp = false) =>
            hp
                ? Math.floor(((2 * base + 31) * level) / 100) + level + 10
                : Math.floor(((2 * base + 31) * level) / 100 + 5);

        const isSpecial = move.damage_class === "special";
        const baseAtk = isSpecial
            ? (attacker.stats.find((s) => s.name === "special-attack")?.base_stat ?? 0)
            : (attacker.stats.find((s) => s.name === "attack")?.base_stat ?? 0);
        const baseDef = isSpecial
            ? (defender.stats.find((s) => s.name === "special-defense")?.base_stat ?? 0)
            : (defender.stats.find((s) => s.name === "defense")?.base_stat ?? 0);
        const baseHp = defender.stats.find((s) => s.name === "hp")?.base_stat ?? 0;

        const atk = calcStat(baseAtk);
        const def = calcStat(baseDef);
        const hp = calcStat(baseHp, true);

        let effectiveness = 1;
        for (const dt of defender.types) {
            const mult = TYPE_CHART[move.type]?.[dt];
            if (mult !== undefined) effectiveness *= mult;
        }

        const stab = attacker.types.includes(move.type);

        const { min, max } = calculateDamage({
            level,
            power: move.power,
            attack: atk,
            defense: def,
            stab,
            typeEffectiveness: effectiveness,
            isCritical: false,
        });

        const minPct = Math.round((min / hp) * 100);
        const maxPct = Math.round((max / hp) * 100);

        let effLabel = "Normal (1×)";
        if (effectiveness === 0) effLabel = "No effect";
        else if (effectiveness === 0.25) effLabel = "Not very effective (¼×)";
        else if (effectiveness === 0.5) effLabel = "Not very effective (½×)";
        else if (effectiveness === 2) effLabel = "Super effective (2×)";
        else if (effectiveness === 4) effLabel = "Super effective (4×)";

        let ko = "4HKO+";
        if (min >= hp) ko = "OHKO";
        else if (min * 2 >= hp) ko = "2HKO";
        else if (max >= hp) ko = "OHKO (high roll)";
        else if (min * 3 >= hp) ko = "3HKO";
        else if (max * 2 >= hp) ko = "2HKO (high roll)";

        return { min, max, minPct, maxPct, effectiveness, effLabel, stab, isSpecial, atk, def, hp, ko, noDamage: false as const };
    });
</script>

<div class="tool-shell max-w-5xl">
    <div class="tool-hero">
        <h1>Damage Calculator</h1>
        <p>Attacker + move + defender with STAB, type effectiveness, % HP, and KO estimate. Shareable via query params.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="panel">
            <h2 class="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Attacker</h2>
            <PokemonPicker bind:value={searchAtt} options={allNames} onselect={(n) => selectAttacker(n)} />
            {#if loadingAtt}<div class="mt-2 w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>{/if}
            {#if attacker}
                <div class="mt-4 flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                    <img src={attacker.sprites.other["official-artwork"].front_default} alt={attacker.name} class="w-14 h-14 object-contain" />
                    <div>
                        <div class="text-sm font-bold">{formatName(attacker.name)}</div>
                        <div class="flex gap-1 mt-1">{#each attacker.types as t}<TypeBadge type={t} size="xs" />{/each}</div>
                    </div>
                </div>
                {#if moveList}
                    <div class="mt-4 flex items-center gap-2 mb-2">
                        <span class="text-xs text-white/40">Level</span>
                        <input type="number" bind:value={level} onchange={syncUrl} min={1} max={100} class="w-16 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs outline-none" />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto">
                        {#each moveList.level_up as m}
                            <button
                                onclick={() => pickMove(m)}
                                class="text-left px-2.5 py-2 rounded-lg text-xs cursor-pointer border flex items-center gap-1.5 {selectedMove?.name === m.name ? 'border-accent bg-accent/10 text-white' : 'border-white/[0.04] bg-white/[0.02] text-white/60'}"
                            >
                                <span style="color: {TYPE_COLORS[m.type] || '#777'}" class="font-bold">{m.type.slice(0, 3).toUpperCase()}</span>
                                <span class="flex-1 truncate">{capitalize(m.name.replace(/-/g, " "))}</span>
                                <span class="text-white/30">{m.power ?? "—"}</span>
                            </button>
                        {/each}
                    </div>
                {/if}
            {/if}
        </div>

        <div class="panel">
            <h2 class="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Defender</h2>
            <PokemonPicker bind:value={searchDef} options={allNames} onselect={selectDefender} />
            {#if loadingDef}<div class="mt-2 w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>{/if}
            {#if defender}
                <div class="mt-4 flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                    <img src={defender.sprites.other["official-artwork"].front_default} alt={defender.name} class="w-14 h-14 object-contain" />
                    <div>
                        <div class="text-sm font-bold">{formatName(defender.name)}</div>
                        <div class="flex gap-1 mt-1">{#each defender.types as t}<TypeBadge type={t} size="xs" />{/each}</div>
                    </div>
                </div>
                <div class="mt-3 flex items-center gap-2">
                    <span class="text-xs text-white/40">Level</span>
                    <input type="number" bind:value={level} onchange={syncUrl} min={1} max={100} class="w-16 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs outline-none" />
                </div>
                {@const defHp = Math.floor(((2 * (defender.stats.find((s) => s.name === "hp")?.base_stat ?? 0) + 31) * level) / 100) + level + 10}
                {@const defDef = Math.floor(((2 * (defender.stats.find((s) => s.name === "defense")?.base_stat ?? 0) + 31) * level) / 100 + 5)}
                {@const defSpd = Math.floor(((2 * (defender.stats.find((s) => s.name === "special-defense")?.base_stat ?? 0) + 31) * level) / 100 + 5)}
                <div class="mt-3 grid grid-cols-3 gap-1.5 text-center">
                    <div class="px-2 py-1.5 rounded-lg bg-white/[0.03]"><div class="text-[10px] text-white/40">HP</div><div class="text-xs font-bold">{defHp}</div></div>
                    <div class="px-2 py-1.5 rounded-lg bg-white/[0.03]"><div class="text-[10px] text-white/40">Defense</div><div class="text-xs font-bold">{defDef}</div></div>
                    <div class="px-2 py-1.5 rounded-lg bg-white/[0.03]"><div class="text-[10px] text-white/40">Sp. Def</div><div class="text-xs font-bold">{defSpd}</div></div>
                </div>
            {/if}
        </div>
    </div>

    {#if !attacker || !defender || !selectedMove}
        <EmptyState title="Set up a calculation" subtitle="Choose attacker, a damaging move, and a defender to see damage ranges." />
    {:else if damageResult?.noDamage}
        <div class="panel text-center text-white/50">{damageResult.label}</div>
    {:else if damageResult && !damageResult.noDamage}
        <div class="panel">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h2 class="text-xl font-bold">Result</h2>
                <span class="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide bg-accent/20 text-accent border border-accent/30">{damageResult.ko}</span>
            </div>

            <div class="mb-6">
                <div class="flex justify-between text-xs text-white/40 mb-1">
                    <span>HP damage</span>
                    <span>{damageResult.minPct}% – {damageResult.maxPct}%</span>
                </div>
                <div class="h-4 bg-white/[0.06] rounded-full overflow-hidden relative">
                    <div class="absolute inset-y-0 left-0 bg-accent/40 rounded-full" style="width: {Math.min(100, damageResult.maxPct)}%"></div>
                    <div class="absolute inset-y-0 left-0 bg-accent rounded-full" style="width: {Math.min(100, damageResult.minPct)}%"></div>
                </div>
                <div class="text-center mt-3 text-2xl font-black">{damageResult.min} – {damageResult.max} <span class="text-sm font-normal text-white/40">/ {damageResult.hp} HP</span></div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div class="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-center">
                    <div class="text-[10px] uppercase text-white/40">Effectiveness</div>
                    <div class="text-sm font-bold mt-1" style="color: {(damageResult.effectiveness ?? 1) >= 2 ? '#ff3e3e' : (damageResult.effectiveness ?? 1) < 1 ? '#4ade80' : '#fff'}">{damageResult.effLabel}</div>
                </div>
                <div class="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-center">
                    <div class="text-[10px] uppercase text-white/40">STAB</div>
                    <div class="text-sm font-bold mt-1" style="color: {damageResult.stab ? '#4ade80' : '#fff'}">{damageResult.stab ? "Yes (+50%)" : "No"}</div>
                </div>
                <div class="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-center">
                    <div class="text-[10px] uppercase text-white/40">{damageResult.isSpecial ? "SpA / SpD" : "Atk / Def"}</div>
                    <div class="text-sm font-bold mt-1">{damageResult.atk} / {damageResult.def}</div>
                </div>
            </div>
        </div>
    {/if}
</div>
