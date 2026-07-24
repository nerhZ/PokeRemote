import {
  TOTAL_POKEMON,
  artworkUrl,
  computeTypeEffectiveness,
  GEN_RANGES,
  getGeneration,
  type PokemonSummary,
  type PokemonDetail,
  type PokemonFormSummary,
  type PokemonMoves,
  type EvolutionStage,
  type RankingEntry,
  type StatRankings,
} from "$lib/pokemon-types";

// ── Internal helpers ─────────────────────────────────────────────────────────

function parseIdFromUrl(url: string): number {
  return parseInt(url.split("/").filter(Boolean).pop() || "0", 10);
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
  let description: string | null = null;
  try {
    const ar = await fetch(a.ability.url);
    if (ar.ok) {
      const ad = await ar.json();
      description = extractEnglishAbilityEffect(ad);
    }
  } catch {}
  return { name: a.ability.name, is_hidden: !!a.is_hidden, description };
}

async function fetchLocations(
  pokemonId: number,
): Promise<{ area: string; method: string; chance: number | null }[]> {
  try {
    const locRes = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${pokemonId}/encounters`,
    );
    if (locRes.ok) {
      const locData = await locRes.json();
      return locData.slice(0, 12).map((loc: any) => {
        const detail = loc.version_details?.[0]?.encounter_details?.[0];
        return {
          area: loc.location_area?.name?.replace(/-/g, " ") ?? "Unknown",
          method: detail?.method?.name?.replace(/-/g, " ") ?? "walk",
          chance: detail?.chance ?? null,
        };
      });
    }
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
        const defRes = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${defaultForm.id}`,
        );
        if (defRes.ok) {
          const defData = await defRes.json();
          movesCount = defData.moves?.length ?? 0;
        }
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

let _autocompleteCache: {
  total: number;
  results: { name: string; id: number }[];
} | null = null;
let _speciesIdsCache: number[] | null = null;

export async function getSpeciesIds(): Promise<number[]> {
  if (_speciesIdsCache) return _speciesIdsCache;
  const res = await fetch(
    `https://pokeapi.co/api/v2/pokemon-species?limit=1025&offset=0`,
  );
  const data = await res.json();
  const ids = data.results.map((s: any) => parseIdFromUrl(s.url));
  _speciesIdsCache = ids;
  return ids;
}

export const getPokemonDetail = async (
  name: string,
): Promise<PokemonDetail> => {
  const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
  if (!pokeRes.ok) throw new Error("Pokemon not found");
  const data = await pokeRes.json();

  let species: any = null;
  if (data.species?.url) {
    try {
      const speciesRes = await fetch(data.species.url);
      if (speciesRes.ok) species = await speciesRes.json();
    } catch {}
  }

  let evolution: EvolutionStage | null = null;
  if (species?.evolution_chain?.url) {
    try {
      const evoRes = await fetch(species.evolution_chain.url);
      if (evoRes.ok)
        evolution = buildEvolutionTree((await evoRes.json()).chain);
    } catch {}
  }

  const types = data.types.map((t: any) => t.type.name);
  const forms = mapVarieties(species?.varieties);

  const [abilities, locations, movesCount] = await Promise.all([
    Promise.all((data.abilities || []).map(fetchAbilityDetail)),
    fetchLocations(data.id),
    resolveMovesCount(data, forms),
  ]);

  const speciesId =
    species?.id ?? (parseIdFromUrl(data.species?.url || "") || data.id);
  const speciesName = species?.name ?? data.species?.name ?? data.name;

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

export const getPokemonMoves = async (name: string): Promise<PokemonMoves> => {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
  if (!response.ok) throw new Error("Pokemon not found");
  const data = await response.json();

  const moves: { level_up: any[]; machine: any[]; egg: any[]; tutor: any[] } = {
    level_up: [],
    machine: [],
    egg: [],
    tutor: [],
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

  let latestVg = "scarlet-violet";
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

  for (const m of data.moves) {
    for (const det of m.version_group_details) {
      if (det.version_group.name === latestVg) {
        const method = det.move_learn_method.name;
        if (method === "level-up") {
          moves.level_up.push({
            name: m.move.name,
            url: m.move.url,
            level: det.level_learned_at,
          });
        } else if (method === "machine") {
          moves.machine.push({ name: m.move.name });
        } else if (method === "egg") {
          moves.egg.push({ name: m.move.name });
        } else if (method === "tutor") {
          moves.tutor.push({ name: m.move.name });
        }
      }
    }
  }

  moves.level_up.sort((a, b) => a.level - b.level);

  const detailedMoves = await Promise.all(
    moves.level_up.map(async (m) => {
      try {
        const mr = await fetch(m.url);
        if (!mr.ok)
          return {
            ...m,
            type: "???",
            power: null,
            accuracy: null,
            pp: null,
            damage_class: "physical",
          };
        const md = await mr.json();
        return {
          name: m.name,
          level: m.level,
          type: md.type?.name ?? "???",
          power: md.power ?? null,
          accuracy: md.accuracy ?? null,
          pp: md.pp ?? null,
          damage_class: md.damage_class?.name ?? "physical",
          method: "level-up",
        };
      } catch {
        return {
          name: m.name,
          level: m.level,
          type: "???",
          power: null,
          accuracy: null,
          pp: null,
          damage_class: "physical",
          method: "level-up",
        };
      }
    }),
  );

  return {
    level_up: detailedMoves,
    machine: moves.machine,
    egg: moves.egg,
    tutor: moves.tutor,
  } as PokemonMoves;
};

export const getStatRankings = async ({
  count = 151,
}: { count?: number } = {}): Promise<StatRankings> => {
  const listRes = await fetch(
    `https://pokeapi.co/api/v2/pokemon?limit=${count}&offset=0`,
  );
  const listData = await listRes.json();

  const allStats: {
    name: string;
    id: number;
    image: string;
    stats: Record<string, number>;
  }[] = [];

  for (let i = 0; i < listData.results.length; i += 25) {
    const batch = listData.results.slice(i, i + 25);
    const results = await Promise.all(
      batch.map(async (p: any) => {
        const id = parseIdFromUrl(p.url);
        try {
          const r = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
          if (!r.ok) return null;
          const d = await r.json();
          const stats: Record<string, number> = {};
          let total = 0;
          for (const s of d.stats) {
            const key = s.stat.name.replace("-", "_");
            stats[key] = s.base_stat;
            total += s.base_stat;
          }
          stats.total = total;
          return {
            name: p.name,
            id,
            image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
            types: d.types.map((t: any) => t.type.name),
            stats,
          };
        } catch {
          return null;
        }
      }),
    );
    allStats.push(...(results.filter(Boolean) as any[]));
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
        types: (p as any).types,
      }));
  }

  return {
    hp: top10("hp"),
    attack: top10("attack"),
    defense: top10("defense"),
    special_attack: top10("special_attack"),
    special_defense: top10("special_defense"),
    speed: top10("speed"),
    total: top10("total"),
  } as StatRankings;
};

/** Full Pokémon resource index (all forms). Uses live API count (≈1351). Cached after first call. */
export const getAutocompleteList = async (
  _opts: {} = {},
): Promise<{ total: number; results: { name: string; id: number }[] }> => {
  if (_autocompleteCache) return _autocompleteCache;
  const head = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1`);
  const headData = await head.json();
  const total = headData.count || TOTAL_POKEMON;
  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon?limit=${total}&offset=0`,
    );
    const data = await response.json();
    _autocompleteCache = {
      total: data.count || total,
      results: data.results.map((p: any) => {
        const id = parseIdFromUrl(p.url);
        return { name: p.name, id };
      }),
    };
    return _autocompleteCache;
  } catch {
    return { total: 0, results: [] };
  }
};

/** Random entry from the full Pokémon resource list (includes forms). */
export const getRandomPokemon = async (
  _opts: {} = {},
): Promise<{ name: string; id: number }> => {
  const head = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1`);
  const headData = await head.json();
  const total = headData.count || TOTAL_POKEMON;
  const offset = Math.floor(Math.random() * total);
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon?limit=1&offset=${offset}`,
  );
  const data = await response.json();
  const entry = data.results[0];
  const id = parseIdFromUrl(entry.url);
  return { name: entry.name as string, id };
};

export const getItemsList = async ({
  limit = 60,
  offset = 0,
}: { limit?: number; offset?: number } = {}): Promise<{
  results: any[];
  count: number;
  next_offset: number;
}> => {
  const response = await fetch(
    `https://pokeapi.co/api/v2/item?limit=${limit}&offset=${offset}`,
  );
  const data = await response.json();
  const results = await Promise.all(
    data.results.map(async (item: any) => {
      try {
        const r = await fetch(item.url);
        if (!r.ok) return null;
        const d = await r.json();
        const effect = d.effect_entries?.find(
          (e: any) => e.language.name === "en",
        );
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
    }),
  );
  return {
    results: results.filter(Boolean),
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

function readGridCache(): GridCache | null {
  try {
    const raw = localStorage.getItem(GRID_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== GRID_CACHE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeGridCache(cache: GridCache) {
  try {
    localStorage.setItem(GRID_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

export async function getAllPokemonSummaries(
  onProgress?: (done: number, total: number) => void,
): Promise<{ data: CachedPokemonSummary[]; fromCache: boolean }> {
  const cached = readGridCache();
  if (cached) {
    try {
      const speciesRes = await fetch(
        `https://pokeapi.co/api/v2/pokemon-species?limit=1`,
      );
      if (speciesRes.ok) {
        const { count } = await speciesRes.json();
        if (cached.speciesCount === count) {
          return { data: cached.data, fromCache: true };
        }
      }
    } catch {}
  }

  const speciesRes = await fetch(
    `https://pokeapi.co/api/v2/pokemon-species?limit=1025&offset=0`,
  );
  const speciesData = await speciesRes.json();
  const { results, count } = speciesData;

  const total = results.length;
  let done = 0;

  const entries: CachedPokemonSummary[] = await Promise.all(
    results.map(async (s: any) => {
      const speciesId = parseIdFromUrl(s.url);
      try {
        const [speciesData, pokeData] = await Promise.all([
          fetch(`https://pokeapi.co/api/v2/pokemon-species/${speciesId}`).then(
            (r) => (r.ok ? r.json() : null),
          ),
          fetch(`https://pokeapi.co/api/v2/pokemon/${s.name}`).then((r) =>
            r.ok ? r.json() : null,
          ),
        ]);

        if (!speciesData) throw new Error("species fetch failed");

        const forms = mapVarieties(speciesData.varieties);
        const types = pokeData
          ? pokeData.types.map((t: any) => t.type.name)
          : [];
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
    }),
  );

  entries.sort((a, b) => a.id - b.id);

  writeGridCache({
    version: GRID_CACHE_VERSION,
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
  const head = await fetch(`https://pokeapi.co/api/v2/item?limit=1`);
  const { count } = await head.json();
  const res = await fetch(
    `https://pokeapi.co/api/v2/item?limit=${count}&offset=0`,
  );
  const data = await res.json();
  _itemNamesCache = data.results.map((i: any) => ({
    name: i.name,
    id: parseIdFromUrl(i.url),
  }));
  return _itemNamesCache as { name: string; id: number }[];
}

export async function searchItems(query: string, limit = 30): Promise<any[]> {
  const q = query.toLowerCase();
  const allNames = await getAllItemNames();
  const matches = allNames.filter((n) => n.name.includes(q)).slice(0, limit);

  const results = await Promise.all(
    matches.map(async (m) => {
      try {
        const r = await fetch(`https://pokeapi.co/api/v2/item/${m.id}`);
        if (!r.ok) return null;
        const d = await r.json();
        const effect = d.effect_entries?.find(
          (e: any) => e.language.name === "en",
        );
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
    }),
  );

  return results.filter(Boolean);
}

export async function getPokemonMetadata(name: string): Promise<{
  moves: {
    name: string;
    type: string;
    power: number | null;
    accuracy: number | null;
    pp: number | null;
    effect: string | null;
  }[];
  abilities: { name: string; description: string | null }[];
}> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
  if (!res.ok) return { moves: [], abilities: [] };
  const data = await res.json();

  const moveNames: string[] = Array.from(
    new Set(data.moves.map((m: any) => m.move.name)),
  );
  const abilityUrls = data.abilities.map((a: any) => a.ability.url);

  const batchSize = 20;
  const moveDetails: any[] = [];
  for (let i = 0; i < moveNames.length; i += batchSize) {
    const batch = moveNames.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (moveName: string) => {
        try {
          const mr = await fetch(`https://pokeapi.co/api/v2/move/${moveName}`);
          if (!mr.ok) return null;
          const md = await mr.json();
          const effect = md.effect_entries?.find(
            (e: any) => e.language.name === "en",
          );
          return {
            name: md.name,
            type: md.type?.name ?? "???",
            power: md.power ?? null,
            accuracy: md.accuracy ?? null,
            pp: md.pp ?? null,
            effect: effect?.short_effect ?? effect?.effect ?? null,
          };
        } catch {
          return null;
        }
      }),
    );
    moveDetails.push(...results.filter(Boolean));
  }

  const abilityDetails = await Promise.all(
    abilityUrls.map(async (url: string) => {
      try {
        const ar = await fetch(url);
        if (!ar.ok) return null;
        const ad = await ar.json();
        return {
          name: ad.name,
          description: extractEnglishAbilityEffect(ad),
        };
      } catch {
        return null;
      }
    }),
  );

  return {
    moves: moveDetails,
    abilities: abilityDetails.filter(Boolean),
  };
}
