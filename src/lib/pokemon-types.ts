// ── Type data ────────────────────────────────────────────────────────────────
export const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D2D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  steel: "#B7B7CE",
  fairy: "#D685AD",
  dark: "#705746",
};

export const ALL_TYPES = Object.keys(TYPE_COLORS);

export const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
    steel: 2,
  },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: {
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ground: 0,
    flying: 2,
    dragon: 0.5,
  },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 0.5,
    ground: 2,
    flying: 2,
    dragon: 2,
    steel: 0.5,
  },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: {
    grass: 2,
    poison: 0.5,
    ground: 0.5,
    rock: 0.5,
    ghost: 0.5,
    steel: 0,
    fairy: 2,
  },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
    steel: 2,
  },
  flying: {
    electric: 0.5,
    grass: 2,
    fighting: 2,
    bug: 2,
    rock: 0.5,
    steel: 0.5,
  },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: {
    fire: 2,
    ice: 2,
    fighting: 0.5,
    ground: 0.5,
    flying: 2,
    bug: 2,
    steel: 0.5,
  },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: {
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    ice: 2,
    rock: 2,
    steel: 0.5,
    fairy: 2,
  },
  fairy: {
    fire: 0.5,
    fighting: 2,
    poison: 0.5,
    dragon: 2,
    dark: 2,
    steel: 0.5,
  },
};

export function getAttackingMatchups(attackingType: string): {
  strong: string[];
  weak: string[];
  immune: string[];
} {
  const chart = TYPE_CHART[attackingType];
  if (!chart) return { strong: [], weak: [], immune: [] };
  const strong: string[] = [];
  const weak: string[] = [];
  const immune: string[] = [];
  for (const [defendingType, multiplier] of Object.entries(chart)) {
    if (multiplier >= 2) strong.push(defendingType);
    else if (multiplier > 0 && multiplier <= 0.5) weak.push(defendingType);
    else if (multiplier === 0) immune.push(defendingType);
  }
  return { strong, weak, immune };
}

// ── Dex constants ─────────────────────────────────────────────────────────────
export const TOTAL_SPECIES = 1025;
export const TOTAL_POKEMON = 1351;

export const GEN_RANGES: { label: string; min: number; max: number }[] = [
  { label: "Gen I (Kanto)", min: 1, max: 151 },
  { label: "Gen II (Johto)", min: 152, max: 251 },
  { label: "Gen III (Hoenn)", min: 252, max: 386 },
  { label: "Gen IV (Sinnoh)", min: 387, max: 493 },
  { label: "Gen V (Unova)", min: 494, max: 649 },
  { label: "Gen VI (Kalos)", min: 650, max: 721 },
  { label: "Gen VII (Alola)", min: 722, max: 809 },
  { label: "Gen VIII (Galar)", min: 810, max: 905 },
  { label: "Gen IX (Paldea)", min: 906, max: 1025 },
];

// ── Interfaces ────────────────────────────────────────────────────────────────
export interface PokemonFormSummary {
  name: string;
  id: number;
  is_default: boolean;
  image: string;
}

export interface EvolutionStage {
  name: string;
  id: number;
  image: string;
  min_level: number | null;
  trigger: string | null;
  item: string | null;
  min_happiness: number | null;
  time_of_day: string | null;
  held_item: string | null;
  known_move: string | null;
  location: string | null;
  trade_species: string | null;
  needs_overworld_rain: boolean;
  gender: number | null;
  known_move_type: string | null;
  min_affection: number | null;
  relative_physical_stats: number | null;
  turn_upside_down: boolean;
  children: EvolutionStage[];
}

export interface TypeMatchup {
  four_x_weak: string[];
  two_x_weak: string[];
  half_resist: string[];
  quarter_resist: string[];
  immune: string[];
}

export interface PokemonDetail {
  name: string;
  id: number;
  species_id: number;
  species_name: string;
  height: number;
  weight: number;
  types: string[];
  sprites: {
    front_default: string;
    front_shiny: string | null;
    other: {
      "official-artwork": {
        front_default: string;
        front_shiny: string | null;
      };
    };
    versions?: {
      "generation-v"?: {
        "black-white"?: {
          animated?: {
            front_default: string | null;
            back_default: string | null;
          };
        };
      };
    };
  };
  stats: { name: string; base_stat: number }[];
  abilities: { name: string; is_hidden: boolean; description: string | null }[];
  base_experience: number;
  moves_count: number;
  cries: string | null;
  flavor_text: string | null;
  genus: string | null;
  is_legendary: boolean;
  is_mythical: boolean;
  capture_rate: number | null;
  base_happiness: number | null;
  growth_rate: string | null;
  habitat: string | null;
  color: string | null;
  shape: string | null;
  egg_groups: string[];
  gender_rate: number | null;
  evolution: EvolutionStage | null;
  type_effectiveness: TypeMatchup;
  locations: { area: string; method: string; chance: number | null }[];
  forms: PokemonFormSummary[];
  /** Regional dex entries from the species resource, e.g. [{dex: "kanto", number: 25}]. */
  pokedex_numbers: { dex: string; number: number }[];
}

// ── Regional dex labels ───────────────────────────────────────────────────────
/** Order regional dex chips by generation; dexes not listed sort last. */
export const DEX_ORDER = [
  "kanto",
  "johto",
  "hoenn",
  "sinnoh",
  "unova",
  "kalos",
  "alola",
  "galar",
  "isle-of-armor",
  "crown-tundra",
  "hisui",
  "paldea",
  "kitakami",
  "blueberry",
];

export const REGIONAL_DEX_LABELS: Record<string, string> = {
  kanto: "Kanto",
  johto: "Johto",
  hoenn: "Hoenn",
  sinnoh: "Sinnoh",
  unova: "Unova",
  kalos: "Kalos",
  alola: "Alola",
  galar: "Galar",
  "isle-of-armor": "Isle of Armor",
  "crown-tundra": "Crown Tundra",
  hisui: "Hisui",
  paldea: "Paldea",
  kitakami: "Kitakami",
  blueberry: "Blueberry",
};

export interface MoveDetail {
  name: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  damage_class: string;
  effect: string | null;
  /** Number of Pokémon that learn this move (PokeAPI `learned_by_pokemon`). */
  learned_by_count?: number;
}

export interface MoveInfo extends MoveDetail {
  level: number;
  method: string;
}

export interface PokemonMoves {
  level_up: MoveInfo[];
  machine: MoveInfo[];
  egg: MoveInfo[];
  tutor: MoveInfo[];
}

export interface RankingEntry {
  name: string;
  id: number;
  image: string;
  value: number;
  types?: string[];
}

export interface StatRankings {
  hp: RankingEntry[];
  attack: RankingEntry[];
  defense: RankingEntry[];
  special_attack: RankingEntry[];
  special_defense: RankingEntry[];
  speed: RankingEntry[];
  total: RankingEntry[];
  base_experience: RankingEntry[];
  height: RankingEntry[];
  weight: RankingEntry[];
  moves_count: RankingEntry[];
}

export interface ItemSummary {
  name: string;
  id: number;
  sprite: string | null;
  category: string | null;
  cost: number;
  effect: string | null;
}

// ── Shared colors ─────────────────────────────────────────────────────────────
export const MATCHUP_COLORS = {
  strong: "#4ade80",
  weak: "#ff3e3e",
  immune: "#f7d02c",
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
export function getGeneration(id: number): string {
  for (const gen of GEN_RANGES) {
    if (id >= gen.min && id <= gen.max) return gen.label;
  }
  return "Unknown";
}

export function artworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

/** Animated gen-5 pixel sprite (GIF), where available (mostly ≤ Gen V + early forms). */
export function animatedSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`;
}

export function formLabel(pokemonName: string, speciesName: string): string {
  if (pokemonName === speciesName) return "Default";
  const prefix = speciesName + "-";
  if (pokemonName.startsWith(prefix)) {
    return pokemonName.slice(prefix.length).split("-").map(titleWord).join(" ");
  }
  return pokemonName.split("-").map(titleWord).join(" ");
}

export function formatName(name: string): string {
  return name.split("-").map(titleWord).join(" ");
}

/** Primary type color for a pokemon/types array, with fallback. */
export function typeColor(
  types: string[] | undefined,
  fallback = "#777",
): string {
  return (types && TYPE_COLORS[types[0]]) || fallback;
}

/** Sum of base stats. */
export function statTotal(stats: { base_stat: number }[]): number {
  return stats.reduce((sum, s) => sum + s.base_stat, 0);
}

/** Formats a species/form id as a zero-padded dex number, e.g. `#025`. */
export function formatId(id: number): string {
  return `#${String(id).padStart(3, "0")}`;
}

/** Short generation tag from a full range label, e.g. "Gen I (Kanto)" → "I". */
export function generationShortLabel(gen: string): string {
  return gen.split(" ")[1]?.replace(/[()]/g, "") ?? "?";
}

/** Pretty-print a PokeAPI generation id, e.g. "generation-iii" → "Gen III". */
export function generationLabel(generation: string | null): string | null {
  if (!generation) return null;
  const m = generation.match(/^generation-([ivxl]+)$/);
  if (!m)
    return generation
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  return `Gen ${m[1].toUpperCase()}`;
}

export const GEN_COLORS: Record<string, string> = {
  I: "#ef4444",
  II: "#f59e0b",
  III: "#10b981",
  IV: "#6366f1",
  V: "#8b5cf6",
  VI: "#ec4899",
  VII: "#f97316",
  VIII: "#3b82f6",
  IX: "#22c55e",
};

const TITLE_OVERRIDES: Record<string, string> = {
  gmax: "Gigantamax",
  alola: "Alola",
  galar: "Galar",
  hisui: "Hisui",
  paldea: "Paldea",
  hooh: "Ho-Oh",
  "type-null": "Type: Null",
  "porygon-z": "Porygon-Z",
  "jangmo-o": "Jangmo-o",
  "hakamo-o": "Hakamo-o",
  "kommo-o": "Kommo-o",
  "wo-chien": "Wo-Chien",
  "chien-pao": "Chien-Pao",
  "ting-lu": "Ting-Lu",
  "chi-yu": "Chi-Yu",
  male: "♂",
  female: "♀",
  "mr-mime": "Mr. Mime",
  "mime-jr": "Mime Jr.",
  "mr-rime": "Mr. Rime",
};

function titleWord(w: string): string {
  if (!w) return w;
  return TITLE_OVERRIDES[w] ?? w.charAt(0).toUpperCase() + w.slice(1);
}

/** Multi-token search match against name and ID. */
export function tokenMatch(
  query: string,
  name: string,
  id: number,
  extraTerms?: string[],
): boolean {
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every(
    (token) =>
      name.toLowerCase().includes(token) ||
      String(id).includes(token) ||
      extraTerms?.some((t) => t.toLowerCase().includes(token)),
  );
}

export function computeTypeEffectiveness(
  defendingTypes: string[],
): TypeMatchup {
  const result: TypeMatchup = {
    four_x_weak: [],
    two_x_weak: [],
    half_resist: [],
    quarter_resist: [],
    immune: [],
  };
  if (!defendingTypes.length) return result;
  for (const attackType of ALL_TYPES) {
    let multiplier = 1;
    for (const defType of defendingTypes) {
      const m = TYPE_CHART[attackType]?.[defType];
      if (m !== undefined) multiplier *= m;
    }
    if (multiplier === 0) result.immune.push(attackType);
    else if (multiplier === 4) result.four_x_weak.push(attackType);
    else if (multiplier === 2) result.two_x_weak.push(attackType);
    else if (multiplier === 0.5) result.half_resist.push(attackType);
    else if (multiplier === 0.25) result.quarter_resist.push(attackType);
  }
  return result;
}

/**
 * Final stat value from base stat, level, IV, EV and nature (gen-5-style).
 * Shared by the damage calculator and team-builder stat preview.
 */
export function statValue(
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

export function calculateDamage(opts: {
  level: number;
  power: number;
  attack: number;
  defense: number;
  stab: boolean;
  typeEffectiveness: number;
  isCritical: boolean;
  /** Extra multipliers (items, weather, terrain) folded into the single
      pre-floor modifier chain, matching the games' rounding order. */
  modifiers?: number[];
}): { min: number; max: number } {
  const { level, power, attack, defense, stab, typeEffectiveness, isCritical } =
    opts;
  const base = Math.floor(
    Math.floor(Math.floor((2 * level) / 5 + 2) * power * (attack / defense)) /
      50 +
      2,
  );
  let modifier = typeEffectiveness;
  if (stab) modifier *= 1.5;
  if (isCritical) modifier *= 1.5;
  for (const m of opts.modifiers ?? []) modifier *= m;
  const min = Math.floor(base * modifier * 0.85);
  const max = Math.floor(base * modifier * 1.0);
  return { min, max };
}

const NATURE_DEFS: {
  name: string;
  modifier: string;
  up: string | null;
  down: string | null;
}[] = [
  {
    name: "Adamant",
    modifier: "+Atk  /  \u2212SpA",
    up: "attack",
    down: "special-attack",
  },
  { name: "Bashful", modifier: "neutral", up: null, down: null },
  {
    name: "Bold",
    modifier: "+Def  /  \u2212Atk",
    up: "defense",
    down: "attack",
  },
  {
    name: "Brave",
    modifier: "+Atk  /  \u2212Spe",
    up: "attack",
    down: "speed",
  },
  {
    name: "Calm",
    modifier: "+SpD  /  \u2212Atk",
    up: "special-defense",
    down: "attack",
  },
  {
    name: "Careful",
    modifier: "+SpD  /  \u2212SpA",
    up: "special-defense",
    down: "special-attack",
  },
  { name: "Docile", modifier: "neutral", up: null, down: null },
  {
    name: "Gentle",
    modifier: "+SpD  /  \u2212Def",
    up: "special-defense",
    down: "defense",
  },
  { name: "Hardy", modifier: "neutral", up: null, down: null },
  {
    name: "Hasty",
    modifier: "+Spe  /  \u2212Def",
    up: "speed",
    down: "defense",
  },
  {
    name: "Impish",
    modifier: "+Def  /  \u2212SpA",
    up: "defense",
    down: "special-attack",
  },
  {
    name: "Jolly",
    modifier: "+Spe  /  \u2212SpA",
    up: "speed",
    down: "special-attack",
  },
  {
    name: "Lax",
    modifier: "+Def  /  \u2212SpD",
    up: "defense",
    down: "special-defense",
  },
  {
    name: "Lonely",
    modifier: "+Atk  /  \u2212Def",
    up: "attack",
    down: "defense",
  },
  {
    name: "Mild",
    modifier: "+SpA  /  \u2212Def",
    up: "special-attack",
    down: "defense",
  },
  {
    name: "Modest",
    modifier: "+SpA  /  \u2212Atk",
    up: "special-attack",
    down: "attack",
  },
  {
    name: "Naive",
    modifier: "+Spe  /  \u2212SpD",
    up: "speed",
    down: "special-defense",
  },
  {
    name: "Naughty",
    modifier: "+Atk  /  \u2212SpD",
    up: "attack",
    down: "special-defense",
  },
  {
    name: "Quiet",
    modifier: "+SpA  /  \u2212Spe",
    up: "special-attack",
    down: "speed",
  },
  { name: "Quirky", modifier: "neutral", up: null, down: null },
  {
    name: "Rash",
    modifier: "+SpA  /  \u2212SpD",
    up: "special-attack",
    down: "special-defense",
  },
  {
    name: "Relaxed",
    modifier: "+Def  /  \u2212Spe",
    up: "defense",
    down: "speed",
  },
  {
    name: "Sassy",
    modifier: "+SpD  /  \u2212Spe",
    up: "special-defense",
    down: "speed",
  },
  { name: "Serious", modifier: "neutral", up: null, down: null },
  {
    name: "Timid",
    modifier: "+Spe  /  \u2212Atk",
    up: "speed",
    down: "attack",
  },
];

export const NATURES: string[] = NATURE_DEFS.map((n) => n.name);

export const NATURES_MODIFIERS: Record<string, string> = Object.fromEntries(
  NATURE_DEFS.map((n) => [n.name, n.modifier]),
);

/** Dropdown-ready nature options (value + modifier meta), shared by team builder and damage calc. */
export const NATURE_OPTIONS: { value: string; meta: string }[] = NATURES.map(
  (n) => ({ value: n, meta: NATURES_MODIFIERS[n] }),
);

export const NATURE_STAT_MODS: Record<
  string,
  { up: string | null; down: string | null }
> = Object.fromEntries(
  NATURE_DEFS.map((n) => [n.name, { up: n.up, down: n.down }]),
);

/** Single source for the six base stats: API name, stat-bar label, EV-input label, EvSpread key. */
export const STAT_DEFS: {
  apiName: string;
  label: string;
  shortLabel: string;
  evKey: "hp" | "atk" | "def" | "spa" | "spd" | "spe";
}[] = [
  { apiName: "hp", label: "HP", shortLabel: "HP", evKey: "hp" },
  { apiName: "attack", label: "ATK", shortLabel: "Atk", evKey: "atk" },
  { apiName: "defense", label: "DEF", shortLabel: "Def", evKey: "def" },
  {
    apiName: "special-attack",
    label: "SP.ATK",
    shortLabel: "SpA",
    evKey: "spa",
  },
  {
    apiName: "special-defense",
    label: "SP.DEF",
    shortLabel: "SpD",
    evKey: "spd",
  },
  { apiName: "speed", label: "SPD", shortLabel: "Spe", evKey: "spe" },
];

export const STAT_LABELS: Record<string, string> = Object.fromEntries(
  STAT_DEFS.map((s) => [s.apiName, s.label]),
);

/** Format a type-effectiveness multiplier, e.g. 2 → "2×". */
export function multiplierLabel(m: number): string {
  if (m === 0) return "0×";
  if (m === 0.25) return "¼×";
  if (m === 0.5) return "½×";
  if (m === 2) return "2×";
  if (m === 4) return "4×";
  return "1×";
}
