// ── Pokémon Showdown team format ─────────────────────────────────────────────
// Parses and formats the standard Showdown teambuilder text format
// ("Name @ Item / Ability: / EVs: / Nature / - Move").

import { STAT_DEFS } from "$lib/pokemon-types";

export type ShowdownEvs = {
  hp?: number;
  atk?: number;
  def?: number;
  spa?: number;
  spd?: number;
  spe?: number;
};

export interface ShowdownSet {
  /** Raw species token as written (e.g. "Alolan Raichu", "Ting-Lu"). */
  species: string;
  nickname?: string;
  moves: string[];
  ability: string;
  nature: string;
  evs: ShowdownEvs;
}

const SHOWDOWN_REGION_PREFIXES: Record<string, string> = {
  alolan: "-alola",
  galarian: "-galar",
  hisuian: "-hisui",
  paldean: "-paldea",
};

const SHOWDOWN_GENDER_FORMS: Record<string, { m: string; f: string }> = {
  nidoran: { m: "nidoran-m", f: "nidoran-f" },
  meowstic: { m: "meowstic-male", f: "meowstic-female" },
  indeedee: { m: "indeedee-male", f: "indeedee-female" },
  basculegion: { m: "basculegion-male", f: "basculegion-female" },
  oinkologne: { m: "oinkologne-male", f: "oinkologne-female" },
};

/** Slug → API name for cases the generic normalization can't produce. */
const SHOWDOWN_SPECIALS: Record<string, string> = {
  nidoran: "nidoran-m",
  zygarde: "zygarde",
};

/** Showdown's EV line labels ("HP", "Atk", "SpA"…) → EvSpread keys. */
const EV_LABELS: Record<string, keyof ShowdownEvs> = Object.fromEntries(
  STAT_DEFS.map((s) => [s.shortLabel.toLowerCase(), s.evKey]),
) as Record<string, keyof ShowdownEvs>;

const NATURE_NAMES = new Set(
  [
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
  ].map((n) => n.toLowerCase()),
);

/** Strip accents, apostrophes, periods, colon and collapse whitespace. */
function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/'/g, "")
    .replace(/\./g, "")
    .replace(/[:]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

/**
 * Normalize a Showdown species token ("Alolan Raichu", "Ting-Lu", "Nidoran♀",
 * "Indeedee-M", "Zygarde-10%") to the PokeAPI name. Unknown tokens return a
 * best-effort slug — callers must validate against the autocomplete list.
 */
export function showdownNameToApi(raw: string): string {
  let s = raw.trim();
  if (!s) return "";
  if (s.includes("♀")) return "nidoran-f";
  if (s.includes("♂")) return "nidoran-m";

  let regionSuffix = "";
  const firstSpace = s.indexOf(" ");
  if (firstSpace > 0) {
    const prefix = s.slice(0, firstSpace).toLowerCase();
    if (prefix in SHOWDOWN_REGION_PREFIXES) {
      regionSuffix = SHOWDOWN_REGION_PREFIXES[prefix];
      s = s.slice(firstSpace + 1).trim();
    }
  }

  const genderMatch = s.match(/^(.+?)-([mf])$/i);
  if (genderMatch) {
    const base = genderMatch[1].toLowerCase();
    const gender = genderMatch[2].toLowerCase();
    const entry = SHOWDOWN_GENDER_FORMS[base];
    if (entry && gender in entry) return entry[gender as "m" | "f"];
  }

  let slug = slugify(s).replace(/%/g, "");
  if (slug in SHOWDOWN_SPECIALS) slug = SHOWDOWN_SPECIALS[slug];
  if (slug === "zygarde-50") slug = "zygarde";

  // Paldean Tauros breeds: "Tauros-Paldea-Aqua" and shorthand "Tauros-Aqua"
  // map to the breed-suffixed API names; bare "Tauros-Paldea" is the Combat
  // breed (the default). Region-prefixed tokens ("Paldean Tauros-Blaze") are
  // handled in the regionSuffix branch below.
  if (!regionSuffix) {
    slug = slug.replace(/^tauros-paldea$/, "tauros-paldea-combat-breed");
    slug = slug.replace(
      /^tauros-paldea-(combat|blaze|aqua)$/,
      "tauros-paldea-$1-breed",
    );
    slug = slug.replace(
      /^tauros-(combat|blaze|aqua)$/,
      "tauros-paldea-$1-breed",
    );
  }

  if (regionSuffix) {
    if (regionSuffix === "-paldea" && slug === "tauros")
      return "tauros-paldea-combat-breed";
    if (regionSuffix === "-paldea" && slug.startsWith("tauros-")) {
      const breed = slug.slice("tauros-".length);
      return `tauros-paldea-${breed}-breed`;
    }
    return `${slug}${regionSuffix}`;
  }
  return slug;
}

/**
 * Normalize a Showdown move name ("Wild Charge", "Hidden Power [Fire]",
 * "Wake-Up Slap") to the PokeAPI name.
 */
export function moveNameToApi(raw: string): string {
  return slugify(raw.replace(/\[[^\]]*\]/g, ""));
}

function parseShowdownEvs(raw: string): ShowdownEvs {
  const evs: ShowdownEvs = {};
  for (const part of raw.split("/")) {
    const m = part.trim().match(/^(\d+)\s+(\S+)$/);
    if (!m) continue;
    const key = EV_LABELS[m[2].toLowerCase()];
    if (key) evs[key] = Math.min(252, Math.max(0, parseInt(m[1], 10)));
  }
  return evs;
}

function parseShowdownHeader(line: string): ShowdownSet {
  const set: ShowdownSet = {
    species: "",
    moves: [],
    ability: "",
    nature: "",
    evs: {},
  };
  let rest = line;
  const atIdx = rest.indexOf(" @ ");
  if (atIdx >= 0) rest = rest.slice(0, atIdx);
  rest = rest.replace(/\s*\(([MFG])\)\s*$/i, "");
  const parenMatch = rest.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (parenMatch) {
    set.nickname = parenMatch[1].trim();
    set.species = parenMatch[2].trim();
  } else {
    set.species = rest.trim();
  }
  return set;
}

/**
 * Parse a full Showdown team paste into per-Pokémon sets. Ignores lines we
 * don't model (item, level, IVs, tera type, shiny, happiness).
 */
export function parseShowdownTeam(text: string): ShowdownSet[] {
  const sets: ShowdownSet[] = [];
  let current: ShowdownSet | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^[-=]{3,}\s*$/.test(line)) continue;
    if (line.startsWith("- ")) {
      current?.moves.push(line.slice(2).trim());
      continue;
    }
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      if (!current) continue;
      const key = line.slice(0, colonIdx).trim().toLowerCase();
      const value = line.slice(colonIdx + 1).trim();
      if (key === "ability") current.ability = value;
      else if (key === "nature") current.nature = value;
      else if (key === "evs") current.evs = parseShowdownEvs(value);
      continue;
    }
    // Showdown writes the nature on its own line without a colon:
    // "Jolly Nature". Only match real nature names so species headers like
    // "Garchomp" are never consumed.
    const natureMatch = line.match(/^(.+?)\s+[Nn]ature$/);
    if (natureMatch && NATURE_NAMES.has(natureMatch[1].toLowerCase())) {
      if (current) current.nature = natureMatch[1];
      continue;
    }
    if (current) sets.push(current);
    current = parseShowdownHeader(line);
  }
  if (current) sets.push(current);
  return sets.filter((s) => s.species.length > 0);
}

/** Showdown EV line labels in the order Showdown writes them. */
const EV_LINE: { key: keyof ShowdownEvs; label: string }[] = STAT_DEFS.map(
  (s) => ({ key: s.evKey, label: s.shortLabel }),
);

/**
 * Format one set as Showdown text. `name` is the PokeAPI name (importable as-is
 * by Showdown, whose IDs strip hyphens and case).
 */
export function formatShowdownSet(opts: {
  name: string;
  moves: string[];
  ability: string;
  nature: string;
  evs: ShowdownEvs;
}): string {
  const { name, moves, ability, nature, evs } = opts;
  const lines = [name];
  if (ability) lines.push(`Ability: ${ability}`);
  const evParts = EV_LINE.filter((s) => (evs[s.key] ?? 0) > 0).map(
    (s) => `${evs[s.key]} ${s.label}`,
  );
  if (evParts.length > 0) lines.push(`EVs: ${evParts.join(" / ")}`);
  if (nature) lines.push(`${nature} Nature`);
  for (const m of moves) {
    if (m) lines.push(`- ${m}`);
  }
  return lines.join("\n");
}
