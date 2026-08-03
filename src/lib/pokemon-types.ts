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
}

export interface MoveDetail {
  name: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  damage_class: string;
  effect: string | null;
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

export function calculateDamage(opts: {
  level: number;
  power: number;
  attack: number;
  defense: number;
  stab: boolean;
  typeEffectiveness: number;
  isCritical: boolean;
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
  const min = Math.floor(base * modifier * 0.85);
  const max = Math.floor(base * modifier * 1.0);
  return { min, max };
}

export const NATURES = [
  "Adamant",
  "Bashful",
  "Bold",
  "Brave",
  "Calm",
  "Careful",
  "Docile",
  "Gentle",
  "Hardy",
  "Hasty",
  "Impish",
  "Jolly",
  "Lax",
  "Lonely",
  "Mild",
  "Modest",
  "Naive",
  "Naughty",
  "Quiet",
  "Quirky",
  "Rash",
  "Relaxed",
  "Sassy",
  "Serious",
  "Timid",
];

export const NATURES_MODIFIERS: Record<string, string> = {
  Adamant: "+Atk  /  \u2212SpA",
  Bashful: "neutral",
  Bold: "+Def  /  \u2212Atk",
  Brave: "+Atk  /  \u2212Spe",
  Calm: "+SpD  /  \u2212Atk",
  Careful: "+SpD  /  \u2212SpA",
  Docile: "neutral",
  Gentle: "+SpD  /  \u2212Def",
  Hardy: "neutral",
  Hasty: "+Spe  /  \u2212Def",
  Impish: "+Def  /  \u2212SpA",
  Jolly: "+Spe  /  \u2212SpA",
  Lax: "+Def  /  \u2212SpD",
  Lonely: "+Atk  /  \u2212Def",
  Mild: "+SpA  /  \u2212Def",
  Modest: "+SpA  /  \u2212Atk",
  Naive: "+Spe  /  \u2212SpD",
  Naughty: "+Atk  /  \u2212SpD",
  Quiet: "+SpA  /  \u2212Spe",
  Quirky: "neutral",
  Rash: "+SpA  /  \u2212SpD",
  Relaxed: "+Def  /  \u2212Spe",
  Sassy: "+SpD  /  \u2212Spe",
  Serious: "neutral",
  Timid: "+Spe  /  \u2212Atk",
};

/** Raised/lowered stat per nature (stat names match PokemonDetail stats). */
export const NATURE_STAT_MODS: Record<
  string,
  { up: string | null; down: string | null }
> = {
  Adamant: { up: "attack", down: "special-attack" },
  Bashful: { up: null, down: null },
  Bold: { up: "defense", down: "attack" },
  Brave: { up: "attack", down: "speed" },
  Calm: { up: "special-defense", down: "attack" },
  Careful: { up: "special-defense", down: "special-attack" },
  Docile: { up: null, down: null },
  Gentle: { up: "special-defense", down: "defense" },
  Hardy: { up: null, down: null },
  Hasty: { up: "speed", down: "defense" },
  Impish: { up: "defense", down: "special-attack" },
  Jolly: { up: "speed", down: "special-attack" },
  Lax: { up: "defense", down: "special-defense" },
  Lonely: { up: "attack", down: "defense" },
  Mild: { up: "special-attack", down: "defense" },
  Modest: { up: "special-attack", down: "attack" },
  Naive: { up: "speed", down: "special-defense" },
  Naughty: { up: "attack", down: "special-defense" },
  Quiet: { up: "special-attack", down: "speed" },
  Quirky: { up: null, down: null },
  Rash: { up: "special-attack", down: "special-defense" },
  Relaxed: { up: "defense", down: "speed" },
  Sassy: { up: "special-defense", down: "speed" },
  Serious: { up: null, down: null },
  Timid: { up: "speed", down: "attack" },
};

export const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
  "special-attack": "SP.ATK",
  "special-defense": "SP.DEF",
  speed: "SPD",
};
