import {
  TOTAL_POKEMON,
  artworkUrl,
  computeTypeEffectiveness,
  getGeneration,
  type ItemSummary,
  type MoveDetail,
  type MoveInfo,
  type PokemonDetail,
  type PokemonFormSummary,
  type PokemonMoves,
  type EvolutionStage,
  type RankingEntry,
  type StatRankings,
} from "$lib/pokemon-types";

const API_BASE = "https://pokeapi.co/api/v2";

// ── Internal helpers ─────────────────────────────────────────────────────────

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${url}`);
  return res.json();
}

async function fetchResourceCount(endpoint: string): Promise<number | null> {
  try {
    return await fetchListCount(endpoint);
  } catch {
    return null;
  }
}

async function fetchListCount(endpoint: string): Promise<number> {
  const { count } = await fetchJson(`${endpoint}?limit=1`);
  return count;
}

async function fetchNameIdList(
  endpoint: string,
): Promise<{ total: number; results: { name: string; id: number }[] }> {
  const count = await fetchListCount(endpoint);
  const data = await fetchJson(`${endpoint}?limit=${count}&offset=0`);
  return {
    total: data.count || count,
    results: data.results.map((p: any) => ({
      name: p.name,
      id: parseIdFromUrl(p.url),
    })),
  };
}

function parseIdFromUrl(url: string): number {
  return parseInt(url.split("/").filter(Boolean).pop() || "0", 10);
}

async function fetchPokemonResource(name: string): Promise<any> {
  const response = await fetch(`${API_BASE}/pokemon/${name}`);
  if (!response.ok) throw new Error("Pokemon not found");
  return response.json();
}

function extractFlavorText(species: any): string | null {
  if (!species?.flavor_text_entries) return null;
  const entry = species.flavor_text_entries.find(
    (e: any) => e.language.name === "en",
  );
  if (!entry) return null;
  return entry.flavor_text
    .replace(/[\n\f\r]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractGenus(species: any): string | null {
  if (!species?.genera) return null;
  const entry = species.genera.find((e: any) => e.language.name === "en");
  return entry?.genus ?? null;
}

function buildEvolutionTree(chain: any): EvolutionStage | null {
  if (!chain) return null;
  const id = parseIdFromUrl(chain.species.url);
  const det = chain.evolution_details?.[0] ?? {};
  const stage: EvolutionStage = {
    name: chain.species.name,
    id,
    image: artworkUrl(id),
    min_level: det.min_level ?? null,
    trigger: det.trigger?.name ?? null,
    item: det.item?.name ?? null,
    min_happiness: det.min_happiness ?? null,
    time_of_day: det.time_of_day ?? null,
    held_item: det.held_item?.name ?? null,
    known_move: det.known_move?.name ?? null,
    location: det.location?.name ?? null,
    trade_species: det.trade_species?.name ?? null,
    needs_overworld_rain: det.needs_overworld_rain ?? false,
    gender: det.gender ?? null,
    known_move_type: det.known_move_type?.name ?? null,
    min_affection: det.min_affection ?? null,
    relative_physical_stats: det.relative_physical_stats ?? null,
    turn_upside_down: det.turn_upside_down ?? false,
    children: [],
  };
  if (chain.evolves_to && chain.evolves_to.length > 0) {
    for (const next of chain.evolves_to) {
      const child = buildEvolutionTree(next);
      if (child) stage.children.push(child);
    }
  }
  return stage;
}

const REGIONAL_SUFFIXES = ["alola", "galar", "hisui", "paldea"];

/** Regional forms whose names don't carry the region suffix. */
const REGIONAL_ALIASES: Record<string, Record<string, string>> = {
  hisui: { basculin: "basculin-white-striped" },
};

function findAliasRegion(name: string): string | null {
  for (const [region, aliases] of Object.entries(REGIONAL_ALIASES)) {
    if (Object.values(aliases).includes(name)) return region;
  }
  return null;
}

/** Regional variant entries keyed by base name, from the cached form catalog. */
async function getRegionalVariantMap(
  region: string,
): Promise<Map<string, { name: string; id: number }>> {
  const map = new Map<string, { name: string; id: number }>();
  try {
    const { results } = await getAutocompleteList();
    for (const r of results) {
      if (r.name.endsWith(`-${region}`)) {
        map.set(r.name.slice(0, -(region.length + 1)), r);
      }
    }
    for (const [base, name] of Object.entries(REGIONAL_ALIASES[region] ?? {})) {
      const entry = results.find((r) => r.name === name);
      if (entry) map.set(base, entry);
    }
  } catch {}
  return map;
}

/** Swap chain nodes to their regional variants where they exist. */
function applyRegionalForms(
  stage: EvolutionStage,
  map: Map<string, { name: string; id: number }>,
): EvolutionStage {
  const regional = map.get(stage.name);
  const next: EvolutionStage = {
    ...stage,
    children: stage.children.map((c) => applyRegionalForms(c, map)),
  };
  if (regional) {
    next.name = regional.name;
    next.id = regional.id;
    next.image = artworkUrl(regional.id);
  }
  return next;
}

function extractEnglishAbilityEffect(data: any): string | null {
  const primary = data.effect_entries?.find(
    (e: any) => e.language.name === "en",
  );
  const fallback = data.flavor_text_entries?.find(
    (e: any) => e.language.name === "en",
  );
  const entry = primary || fallback;
  return (
    entry?.short_effect ||
    entry?.effect ||
    entry?.flavor_text?.replace(/[\n\f\r]/g, " ") ||
    null
  );
}

async function fetchAbilityDetail(
  a: any,
): Promise<{ name: string; is_hidden: boolean; description: string | null }> {
  const data = await fetchAbilityData(a.ability.name, a.ability.url);
  return {
    name: a.ability.name,
    is_hidden: !!a.is_hidden,
    description: data.description,
  };
}

async function fetchLocations(
  pokemonId: number,
): Promise<{ area: string; method: string; chance: number | null }[]> {
  try {
    const locData = await fetchJson(
      `${API_BASE}/pokemon/${pokemonId}/encounters`,
    );
    return locData.slice(0, 12).map((loc: any) => {
      const detail = loc.version_details?.[0]?.encounter_details?.[0];
      return {
        area: loc.location_area?.name?.replace(/-/g, " ") ?? "Unknown",
        method: detail?.method?.name?.replace(/-/g, " ") ?? "walk",
        chance: detail?.chance ?? null,
      };
    });
  } catch {}
  return [];
}

async function resolveMovesCount(
  data: any,
  forms: PokemonFormSummary[],
): Promise<number> {
  let movesCount = data.moves?.length ?? 0;
  if (movesCount === 0 && forms.length > 1) {
    const defaultForm = forms.find((f) => f.is_default);
    if (defaultForm && defaultForm.name !== data.name) {
      try {
        const defData = await fetchJson(
          `${API_BASE}/pokemon/${defaultForm.id}`,
        );
        movesCount = defData.moves?.length ?? 0;
      } catch {}
    }
  }
  return movesCount;
}

function mapVarieties(varieties: any[] | undefined): PokemonFormSummary[] {
  if (!varieties?.length) return [];
  return varieties.map((v: any) => {
    const id = parseIdFromUrl(v.pokemon.url);
    return {
      name: v.pokemon.name,
      id,
      is_default: !!v.is_default,
      image: artworkUrl(id),
    };
  });
}

async function fetchItemDetail(url: string): Promise<ItemSummary | null> {
  try {
    const d = await fetchJson(url);
    const effect = d.effect_entries?.find((e: any) => e.language.name === "en");
    return {
      name: d.name,
      id: d.id,
      sprite: d.sprites?.default ?? null,
      category: d.category?.name ?? null,
      cost: d.cost ?? 0,
      effect: effect?.short_effect ?? null,
    };
  } catch {
    return null;
  }
}

/** PokeAPI ships these moves with no text in any language; documented game effects. */
const MOVE_EFFECT_FALLBACKS: Record<string, string> = {
  "blazing-torque": "Deals damage and has a 20% chance to burn the target.",
  "wicked-torque":
    "Deals damage and has a 20% chance to make the target fall asleep.",
  "noxious-torque": "Deals damage and has a 30% chance to poison the target.",
  "combat-torque": "Deals damage and has a 30% chance to paralyze the target.",
  "magical-torque": "Deals damage and has a 30% chance to confuse the target.",
};

async function fetchMoveDetail(name: string): Promise<MoveDetail | null> {
  const cached = moveCache()[name];
  if (cached) return cached;
  try {
    const md = await fetchJson(`${API_BASE}/move/${name}`);
    const effect = md.effect_entries?.find(
      (e: any) => e.language.name === "en",
    );
    const flavor = md.flavor_text_entries?.find(
      (e: any) => e.language.name === "en",
    );
    const detail: MoveDetail = {
      name: md.name,
      type: md.type?.name ?? "???",
      power: md.power ?? null,
      accuracy: md.accuracy ?? null,
      pp: md.pp ?? null,
      damage_class: md.damage_class?.name ?? "physical",
      effect:
        MOVE_EFFECT_FALLBACKS[name] ??
        effect?.short_effect ??
        effect?.effect ??
        flavor?.flavor_text?.replace(/[\n\f\r]/g, " ") ??
        null,
    };
    moveCache()[name] = detail;
    return detail;
  } catch {
    return null;
  }
}

async function fetchMoveDetails(
  names: string[],
): Promise<(MoveDetail | null)[]> {
  const results: (MoveDetail | null)[] = [];
  for (let i = 0; i < names.length; i += 20) {
    const batch = names.slice(i, i + 20);
    const fetched = await Promise.all(batch.map(fetchMoveDetail));
    results.push(...fetched);
  }
  persistMoveCache();
  return results;
}

// ── Move & ability detail caches (immutable data, validated by version only) ──

const MOVE_CACHE_KEY = "pokeremote:move-cache";
const MOVE_CACHE_VERSION = 3;
const ABILITY_CACHE_KEY = "pokeremote:ability-cache";
const ABILITY_CACHE_VERSION = 2;

let _moveCache: Record<string, MoveDetail> | null = null;
let _abilityCache: Record<string, CachedAbility> | null = null;

interface CachedAbility {
  description: string | null;
  generation: string | null;
  pokemon_count: number;
}

function moveCache(): Record<string, MoveDetail> {
  _moveCache ??=
    readCache<{ data: Record<string, MoveDetail> }>(
      MOVE_CACHE_KEY,
      MOVE_CACHE_VERSION,
    )?.data ?? {};
  return _moveCache;
}

function abilityCache(): Record<string, CachedAbility> {
  _abilityCache ??=
    readCache<{ data: Record<string, CachedAbility> }>(
      ABILITY_CACHE_KEY,
      ABILITY_CACHE_VERSION,
    )?.data ?? {};
  return _abilityCache;
}

function persistMoveCache() {
  writeCache(MOVE_CACHE_KEY, MOVE_CACHE_VERSION, { data: moveCache() });
}

function persistAbilityCache() {
  writeCache(ABILITY_CACHE_KEY, ABILITY_CACHE_VERSION, {
    data: abilityCache(),
  });
}

/** Cached ability resource fields; single fetch per ability shared by all consumers. */
async function fetchAbilityData(
  name: string,
  url: string,
): Promise<CachedAbility> {
  const cache = abilityCache();
  if (name in cache) return cache[name];
  try {
    const ad = await fetchJson(url);
    const entry: CachedAbility = {
      description: extractEnglishAbilityEffect(ad),
      generation: ad.generation?.name ?? null,
      pokemon_count: ad.pokemon?.length ?? 0,
    };
    cache[name] = entry;
    return entry;
  } catch {
    return { description: null, generation: null, pokemon_count: 0 };
  }
}

let _autocompleteCache: {
  total: number;
  results: { name: string; id: number }[];
} | null = null;
let _speciesIdsCache: number[] | null = null;

export async function getSpeciesIds(): Promise<number[]> {
  if (_speciesIdsCache) return _speciesIdsCache;
  const data = await fetchJson(
    `${API_BASE}/pokemon-species?limit=1025&offset=0`,
  );
  const ids = data.results.map((s: any) => parseIdFromUrl(s.url));
  _speciesIdsCache = ids;
  return ids;
}

export const getPokemonDetail = async (
  name: string,
): Promise<PokemonDetail> => {
  const data = await fetchPokemonResource(name);

  let species: any = null;
  if (data.species?.url) {
    try {
      species = await fetchJson(data.species.url);
    } catch {}
  }

  let evolution: EvolutionStage | null = null;
  if (species?.evolution_chain?.url) {
    try {
      evolution = buildEvolutionTree(
        (await fetchJson(species.evolution_chain.url)).chain,
      );
    } catch {}
  }

  const types = data.types.map((t: any) => t.type.name);
  const forms = mapVarieties(species?.varieties);

  const [abilities, locations, movesCount] = await Promise.all([
    Promise.all((data.abilities || []).map(fetchAbilityDetail)),
    fetchLocations(data.id),
    resolveMovesCount(data, forms),
  ]);
  persistAbilityCache();

  const speciesId =
    species?.id ?? (parseIdFromUrl(data.species?.url || "") || data.id);
  const speciesName = species?.name ?? data.species?.name ?? data.name;

  // Mirror the evolution chain to the viewed form's region (e.g. alolan rattata
  // shows rattata-alola → raticate-alola) where those variants exist. The region
  // is detected from the pokemon resource name — regional forms point at the
  // base species, so speciesName alone never carries the suffix.
  const regionMatch = data.name.match(/-([a-z]+)$/);
  const region =
    regionMatch && REGIONAL_SUFFIXES.includes(regionMatch[1])
      ? regionMatch[1]
      : findAliasRegion(data.name);
  if (evolution && region) {
    const regional = await getRegionalVariantMap(region);
    if (regional.size > 0) evolution = applyRegionalForms(evolution, regional);
  }

  return {
    name: data.name,
    id: data.id,
    species_id: speciesId,
    species_name: speciesName,
    height: data.height,
    weight: data.weight,
    types,
    sprites: data.sprites,
    stats: data.stats.map((s: any) => ({
      name: s.stat.name,
      base_stat: s.base_stat,
    })),
    abilities,
    base_experience: data.base_experience,
    moves_count: movesCount,
    cries: data.cries?.latest ?? null,
    flavor_text: extractFlavorText(species),
    genus: extractGenus(species),
    is_legendary: species?.is_legendary ?? false,
    is_mythical: species?.is_mythical ?? false,
    capture_rate: species?.capture_rate ?? null,
    base_happiness: species?.base_happiness ?? null,
    growth_rate: species?.growth_rate?.name ?? null,
    habitat: species?.habitat?.name ?? null,
    color: species?.color?.name ?? null,
    shape: species?.shape?.name ?? null,
    egg_groups: species?.egg_groups?.map((g: any) => g.name) ?? [],
    gender_rate: species?.gender_rate ?? null,
    evolution,
    type_effectiveness: computeTypeEffectiveness(types),
    locations,
    forms: forms.length
      ? forms
      : [
          {
            name: data.name,
            id: data.id,
            is_default: true,
            image: artworkUrl(data.id),
          },
        ],
  } as PokemonDetail;
};

const VG_ORDER = [
  "red-blue",
  "yellow",
  "gold-silver",
  "crystal",
  "ruby-sapphire",
  "emerald",
  "firered-leafgreen",
  "diamond-pearl",
  "platinum",
  "heartgold-soulsilver",
  "black-white",
  "colosseum",
  "xd",
  "black-2-white-2",
  "x-y",
  "omega-ruby-alpha-sapphire",
  "sun-moon",
  "ultra-sun-ultra-moon",
  "lets-go-pikachu-lets-go-eevee",
  "sword-shield",
  "the-isle-of-armor",
  "the-crown-tundra",
  "brilliant-diamond-and-shining-pearl",
  "legends-arceus",
  "scarlet-violet",
  "the-teal-mask",
  "the-indigo-disk",
];

export const getPokemonMoves = async (name: string): Promise<PokemonMoves> => {
  const data = await fetchPokemonResource(name);

  let latestVg: string | null = null;
  let latestIdx = -1;
  const seenVg = new Set<string>();
  for (const m of data.moves) {
    for (const det of m.version_group_details) {
      const vgName = det.version_group.name;
      if (seenVg.has(vgName)) continue;
      seenVg.add(vgName);
      const idx = VG_ORDER.indexOf(vgName);
      if (idx > latestIdx) {
        latestIdx = idx;
        latestVg = vgName;
      }
    }
  }
  if (!latestVg) latestVg = [...seenVg][0] ?? "scarlet-violet";

  const collected: { name: string; level: number; method: string }[] = [];
  for (const m of data.moves) {
    for (const det of m.version_group_details) {
      if (det.version_group.name !== latestVg) continue;
      const method = det.move_learn_method.name;
      if (method === "level-up") {
        collected.push({
          name: m.move.name,
          level: det.level_learned_at,
          method,
        });
      } else if (
        method === "machine" ||
        method === "egg" ||
        method === "tutor"
      ) {
        collected.push({ name: m.move.name, level: 0, method });
      }
    }
  }
  collected.sort((a, b) => a.level - b.level);

  const fetched = await fetchMoveDetails(collected.map((m) => m.name));
  const detailed: MoveInfo[] = fetched.map((d, i) => {
    const m = collected[i];
    return {
      name: m.name,
      level: m.level,
      type: d?.type ?? "???",
      power: d?.power ?? null,
      accuracy: d?.accuracy ?? null,
      pp: d?.pp ?? null,
      damage_class: d?.damage_class ?? "physical",
      method: m.method,
      effect: d?.effect ?? null,
    };
  });

  return {
    level_up: detailed.filter((m) => m.method === "level-up"),
    machine: detailed.filter((m) => m.method === "machine"),
    egg: detailed.filter((m) => m.method === "egg"),
    tutor: detailed.filter((m) => m.method === "tutor"),
  };
};

const RANKINGS_CACHE_KEY = "pokeremote:rankings";
const RANKINGS_CACHE_VERSION = 3;

interface RankingsCache {
  version: number;
  data: StatRankings;
  pokemonCount: number;
}

function readCache<T>(key: string, version: number): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== version) return null;
    return parsed as T;
  } catch {
    return null;
  }
}

function writeCache(
  key: string,
  version: number,
  payload: Record<string, unknown>,
) {
  try {
    localStorage.setItem(key, JSON.stringify({ version, ...payload }));
  } catch {}
}

export const getStatRankings = async ({
  count = TOTAL_POKEMON,
}: { count?: number } = {}): Promise<{
  data: StatRankings;
  fromCache: boolean;
}> => {
  const cached = readCache<RankingsCache>(
    RANKINGS_CACHE_KEY,
    RANKINGS_CACHE_VERSION,
  );
  if (cached) {
    const pokemonCount = await fetchResourceCount(`${API_BASE}/pokemon`);
    // Offline: keep the cached rankings rather than discarding them.
    if (pokemonCount === null) return { data: cached.data, fromCache: true };
    if (cached.pokemonCount === pokemonCount) {
      return { data: cached.data, fromCache: true };
    }
  }

  const listData = await fetchJson(
    `${API_BASE}/pokemon?limit=${count}&offset=0`,
  );

  const allStats: {
    name: string;
    id: number;
    image: string;
    types: string[];
    stats: Record<string, number>;
  }[] = [];

  for (let i = 0; i < listData.results.length; i += 25) {
    const batch = listData.results.slice(i, i + 25);
    const results = await Promise.all(
      batch.map(async (p: any) => {
        const id = parseIdFromUrl(p.url);
        try {
          const d = await fetchJson(`${API_BASE}/pokemon/${id}`);
          const stats: Record<string, number> = {};
          let total = 0;
          for (const s of d.stats) {
            const key = s.stat.name.replace("-", "_");
            stats[key] = s.base_stat;
            total += s.base_stat;
          }
          stats.total = total;
          stats.base_experience = d.base_experience ?? 0;
          stats.height = d.height ?? 0;
          stats.weight = d.weight ?? 0;
          stats.moves_count = d.moves?.length ?? 0;
          return {
            name: p.name,
            id,
            image: artworkUrl(id),
            types: d.types.map((t: any) => t.type.name),
            stats,
          };
        } catch {
          return null;
        }
      }),
    );
    allStats.push(
      ...results.filter(
        (r): r is NonNullable<(typeof results)[number]> => r != null,
      ),
    );
  }

  function top10(key: string): RankingEntry[] {
    return allStats
      .filter((p) => p.stats[key] !== undefined && p.stats[key] > 0)
      .sort((a, b) => b.stats[key] - a.stats[key])
      .slice(0, 10)
      .map((p) => ({
        name: p.name,
        id: p.id,
        image: p.image,
        value: p.stats[key],
        types: p.types,
      }));
  }

  const result = {
    hp: top10("hp"),
    attack: top10("attack"),
    defense: top10("defense"),
    special_attack: top10("special_attack"),
    special_defense: top10("special_defense"),
    speed: top10("speed"),
    total: top10("total"),
    base_experience: top10("base_experience"),
    height: top10("height"),
    weight: top10("weight"),
    moves_count: top10("moves_count"),
  } as StatRankings;

  // If the rebuild came back empty (e.g. rate-limited detail fetches), keep a
  // previously cached rebuild for this visit too — and never persist an empty
  // result, which would otherwise serve as a permanent "No data" cache.
  const rebuildEmpty = Object.values(result).every((list) => list.length === 0);
  if (rebuildEmpty && cached) {
    return { data: cached.data, fromCache: true };
  }
  if (!rebuildEmpty) {
    writeCache(RANKINGS_CACHE_KEY, RANKINGS_CACHE_VERSION, {
      data: result,
      pokemonCount: listData.count,
    });
  }
  return { data: result, fromCache: false };
};

const AUTOCOMPLETE_CACHE_KEY = "pokeremote:autocomplete";
const AUTOCOMPLETE_CACHE_VERSION = 1;

let _autocompletePromise: Promise<{
  total: number;
  results: { name: string; id: number }[];
}> | null = null;

async function loadAutocompleteList() {
  const cached = readCache<{
    data: { total: number; results: { name: string; id: number }[] };
  }>(AUTOCOMPLETE_CACHE_KEY, AUTOCOMPLETE_CACHE_VERSION);
  if (cached) {
    const count = await fetchResourceCount(`${API_BASE}/pokemon`);
    if (count !== null && cached.data.total === count) {
      return cached.data;
    }
  }
  try {
    const data = await fetchNameIdList(`${API_BASE}/pokemon`);
    writeCache(AUTOCOMPLETE_CACHE_KEY, AUTOCOMPLETE_CACHE_VERSION, { data });
    return data;
  } catch {
    return { total: 0, results: [] };
  }
}

/** Full Pokémon resource index (all forms). Uses live API count (≈1351). Cached in memory + localStorage. */
export const getAutocompleteList = async (): Promise<{
  total: number;
  results: { name: string; id: number }[];
}> => {
  if (_autocompleteCache) return _autocompleteCache;
  _autocompletePromise ??= loadAutocompleteList();
  const data = await _autocompletePromise;
  if (data.results.length > 0) {
    _autocompleteCache = data;
  } else {
    // transient failure — don't cache the empty result; allow a retry next call
    _autocompletePromise = null;
  }
  return data;
};

/** Random entry from the full Pokémon resource list (includes forms). */
export const getRandomPokemon = async (): Promise<{
  name: string;
  id: number;
}> => {
  const total = (await fetchListCount(`${API_BASE}/pokemon`)) || TOTAL_POKEMON;
  const offset = Math.floor(Math.random() * total);
  const data = await fetchJson(`${API_BASE}/pokemon?limit=1&offset=${offset}`);
  const entry = data.results[0];
  return { name: entry.name as string, id: parseIdFromUrl(entry.url) };
};

const ITEMS_CACHE_KEY = "pokeremote:items";
const ITEMS_CACHE_VERSION = 1;

interface ItemsCache {
  version: number;
  count: number;
  results: ItemSummary[];
}

export const getItemsList = async ({
  limit = 60,
  offset = 0,
}: { limit?: number; offset?: number } = {}): Promise<{
  results: ItemSummary[];
  count: number;
  next_offset: number;
}> => {
  if (offset === 0) {
    const cached = readCache<ItemsCache>(ITEMS_CACHE_KEY, ITEMS_CACHE_VERSION);
    if (cached) {
      const count = await fetchResourceCount(`${API_BASE}/item`);
      if (count !== null && cached.count === count) {
        return {
          results: cached.results.slice(0, limit),
          count: cached.count,
          next_offset: limit,
        };
      }
    }
  }

  const data = await fetchJson(
    `${API_BASE}/item?limit=${limit}&offset=${offset}`,
  );
  const results = (
    await Promise.all(
      data.results.map((item: any) => fetchItemDetail(item.url)),
    )
  ).filter((r): r is ItemSummary => r !== null);

  if (offset === 0) {
    writeCache(ITEMS_CACHE_KEY, ITEMS_CACHE_VERSION, {
      count: data.count,
      results,
    });
  }

  return {
    results,
    count: data.count,
    next_offset: offset + limit,
  };
};

// ── Grid cache — full species preload ─────────────────────────────────────────

interface CachedPokemonSummary {
  name: string;
  id: number;
  image: string;
  types: string[];
  form_count: number;
  forms: PokemonFormSummary[];
  gen: string;
}

interface GridCache {
  version: number;
  timestamp: number;
  speciesCount: number;
  data: CachedPokemonSummary[];
}

const GRID_CACHE_KEY = "pokeremote:grid-cache";
const GRID_CACHE_VERSION = 1;

export async function getAllPokemonSummaries(
  onProgress?: (done: number, total: number) => void,
): Promise<{ data: CachedPokemonSummary[]; fromCache: boolean }> {
  const cached = readCache<GridCache>(GRID_CACHE_KEY, GRID_CACHE_VERSION);
  if (cached) {
    const count = await fetchResourceCount(`${API_BASE}/pokemon-species`);
    if (count !== null && cached.speciesCount === count) {
      return { data: cached.data, fromCache: true };
    }
  }

  const { results, count } = await fetchJson(
    `${API_BASE}/pokemon-species?limit=1025&offset=0`,
  );

  const total = results.length;
  let done = 0;

  async function fetchEntry(s: any): Promise<CachedPokemonSummary> {
    const speciesId = parseIdFromUrl(s.url);
    try {
      const [speciesData, pokeData] = await Promise.all([
        fetch(`${API_BASE}/pokemon-species/${speciesId}`).then((r) =>
          r.ok ? r.json() : null,
        ),
        fetch(`${API_BASE}/pokemon/${s.name}`).then((r) =>
          r.ok ? r.json() : null,
        ),
      ]);

      if (!speciesData) throw new Error("species fetch failed");

      const forms = mapVarieties(speciesData.varieties);
      const types = pokeData ? pokeData.types.map((t: any) => t.type.name) : [];
      const defaultForm = forms.find((f) => f.is_default) || forms[0];

      return {
        name: defaultForm?.name || s.name,
        id: speciesId,
        image: artworkUrl(speciesId),
        types,
        form_count: forms.length,
        forms,
        gen: getGeneration(speciesId),
      } as CachedPokemonSummary;
    } catch {
      return {
        name: s.name,
        id: speciesId,
        image: artworkUrl(speciesId),
        types: [],
        form_count: 1,
        forms: [
          {
            name: s.name,
            id: speciesId,
            is_default: true,
            image: artworkUrl(speciesId),
          },
        ],
        gen: getGeneration(speciesId),
      } as CachedPokemonSummary;
    } finally {
      done++;
      onProgress?.(done, total);
    }
  }

  const entries: CachedPokemonSummary[] = [];
  // Batch so the browser's connection pool isn't exhausted (a full-parallel
  // burst fails hundreds of fetches, leaving entries with empty types).
  for (let i = 0; i < results.length; i += 30) {
    const batch = results.slice(i, i + 30);
    const batchEntries = await Promise.all(batch.map(fetchEntry));
    entries.push(...batchEntries);
  }

  // Retry entries whose fetches failed (e.g. rate-limited) once.
  const failed = entries.filter((e) => e.types.length === 0);
  if (failed.length > 0) {
    await new Promise((r) => setTimeout(r, 1500));
    await Promise.all(
      failed.map(async (e) => {
        try {
          const s = results.find((x: any) => parseIdFromUrl(x.url) === e.id);
          if (!s) return;
          const fixed = await fetchEntry(s);
          if (fixed.types.length > 0) {
            Object.assign(e, fixed);
          }
        } catch {}
      }),
    );
  }

  entries.sort((a, b) => a.id - b.id);

  writeCache(GRID_CACHE_KEY, GRID_CACHE_VERSION, {
    timestamp: Date.now(),
    speciesCount: count,
    data: entries,
  });

  return { data: entries, fromCache: false };
}

// ── Item search ──────────────────────────────────────────────────────────────

let _itemNamesCache: { name: string; id: number }[] | null = null;

async function getAllItemNames(): Promise<{ name: string; id: number }[]> {
  if (_itemNamesCache) return _itemNamesCache;
  _itemNamesCache = (await fetchNameIdList(`${API_BASE}/item`)).results;
  return _itemNamesCache;
}

export async function searchItems(query: string): Promise<ItemSummary[]> {
  const q = query.toLowerCase();
  const allNames = await getAllItemNames();
  const matches = allNames.filter((n) => n.name.includes(q)).slice(0, 30);
  return (
    await Promise.all(
      matches.map((m) => fetchItemDetail(`${API_BASE}/item/${m.id}`)),
    )
  ).filter((r): r is ItemSummary => r !== null);
}

type AbilitySummary = { name: string; description: string | null };
export type { AbilitySummary };

export async function getPokemonMetadata(name: string): Promise<{
  moves: MoveDetail[];
  abilities: AbilitySummary[];
}> {
  let data: any;
  try {
    data = await fetchPokemonResource(name);
  } catch {
    return { moves: [], abilities: [] };
  }

  const moveNames: string[] = Array.from(
    new Set(data.moves.map((m: any) => m.move.name)),
  );
  const moves = (await fetchMoveDetails(moveNames)).filter(
    (m): m is MoveDetail => m !== null,
  );

  const abilities = await Promise.all(
    data.abilities.map(async (a: any): Promise<AbilitySummary> => ({
      name: a.ability.name,
      description: (await fetchAbilityData(a.ability.name, a.ability.url))
        .description,
    })),
  );
  persistAbilityCache();

  return { moves, abilities };
}

// ── Abilities dex ────────────────────────────────────────────────────────────

export interface AbilityEntry {
  name: string;
  generation: string | null;
  effect: string | null;
  pokemon_count: number;
}

const ABILITIES_CACHE_KEY = "pokeremote:abilities";
const ABILITIES_CACHE_VERSION = 3;

async function fetchAbilityEntry(name: string): Promise<AbilityEntry | null> {
  try {
    const data = await fetchAbilityData(name, `${API_BASE}/ability/${name}`);
    return {
      name,
      generation: data.generation,
      effect: data.description,
      pokemon_count: data.pokemon_count,
    };
  } catch {
    return null;
  }
}

/** Full ability dex with details, cached in localStorage (validated by live count). */
export async function getAllAbilities(): Promise<AbilityEntry[]> {
  const cached = readCache<{ data: AbilityEntry[]; total: number }>(
    ABILITIES_CACHE_KEY,
    ABILITIES_CACHE_VERSION,
  );
  if (cached) {
    const count = await fetchResourceCount(`${API_BASE}/ability`);
    if (count !== null && cached.total === count) return cached.data;
  }
  const { results } = await fetchNameIdList(`${API_BASE}/ability`);
  const entries: AbilityEntry[] = [];
  for (let i = 0; i < results.length; i += 20) {
    const batch = results.slice(i, i + 20);
    const fetched = await Promise.all(
      batch.map((a) => fetchAbilityEntry(a.name)),
    );
    entries.push(...fetched.filter((e): e is AbilityEntry => e !== null));
  }
  persistAbilityCache();
  entries.sort((a, b) => a.name.localeCompare(b.name));
  writeCache(ABILITIES_CACHE_KEY, ABILITIES_CACHE_VERSION, {
    data: entries,
    total: results.length,
  });
  return entries;
}

// ── Moves dex ────────────────────────────────────────────────────────────────

let _moveNamesCache: { name: string; id: number }[] | null = null;
let _sortedMoveNames: string[] | null = null;

async function getAllMoveNames(): Promise<{ name: string; id: number }[]> {
  if (_moveNamesCache) return _moveNamesCache;
  _moveNamesCache = (await fetchNameIdList(`${API_BASE}/move`)).results;
  return _moveNamesCache;
}

export async function getMovesTotal(): Promise<number> {
  return (await getAllMoveNames()).length;
}

/** A name-sorted slice of move details; already-fetched moves come from cache. */
export async function getMovesSlice(
  offset: number,
  limit: number,
): Promise<MoveDetail[]> {
  _sortedMoveNames ??= (await getAllMoveNames()).map((r) => r.name).sort();
  return (
    await fetchMoveDetails(_sortedMoveNames.slice(offset, offset + limit))
  ).filter((m): m is MoveDetail => m !== null);
}
