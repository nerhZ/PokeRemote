import { browser } from "$app/environment";

const FAV_KEY = "pokeremote:favorites";
const RECENT_KEY = "pokeremote:recent";
const THEME_KEY = "pokeremote:theme";
const TEAM_KEY = "pokeremote:teams";

export type FavEntry = {
  id: number;
  name: string;
  image: string;
  types: string[];
};
export type RecentEntry = { id: number; name: string; image: string };
export type ThemeMode = "dark" | "light";

function read<T>(key: string, fallback: T): T {
  if (!browser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (!browser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function getFavorites(): FavEntry[] {
  return read<FavEntry[]>(FAV_KEY, []);
}

export function isFavorite(id: number): boolean {
  return getFavorites().some((f) => f.id === id);
}

export function toggleFavorite(entry: FavEntry): FavEntry[] {
  const list = getFavorites();
  const idx = list.findIndex((f) => f.id === entry.id);
  const next =
    idx >= 0
      ? list.filter((f) => f.id !== entry.id)
      : [entry, ...list].slice(0, 48);
  write(FAV_KEY, next);
  return next;
}

export function getRecent(): RecentEntry[] {
  return read<RecentEntry[]>(RECENT_KEY, []);
}

export function pushRecent(entry: RecentEntry): RecentEntry[] {
  const list = getRecent().filter((r) => r.id !== entry.id);
  const next = [entry, ...list].slice(0, 12);
  write(RECENT_KEY, next);
  return next;
}

export function getTheme(): ThemeMode {
  if (!browser) return "dark";
  const stored = localStorage.getItem(THEME_KEY) as ThemeMode | null;
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

export function setTheme(mode: ThemeMode) {
  if (!browser) return;
  localStorage.setItem(THEME_KEY, mode);
  document.documentElement.dataset.theme = mode;
}

export function applyTheme() {
  if (!browser) return;
  document.documentElement.dataset.theme = getTheme();
}

export type EvSpread = {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
};

export const EV_STATS: { key: keyof EvSpread; label: string }[] = [
  { key: "hp", label: "HP" },
  { key: "atk", label: "Atk" },
  { key: "def", label: "Def" },
  { key: "spa", label: "SpA" },
  { key: "spd", label: "SpD" },
  { key: "spe", label: "Spe" },
];

export function zeroEvs(): EvSpread {
  return { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
}

export function getSavedTeams(): {
  name: string;
  ids: number[];
  names: string[];
  moves: string[][];
  ability: string[];
  nature: string[];
  evs: EvSpread[];
}[] {
  return read(TEAM_KEY, []).map((t: any) => ({
    name: t.name,
    ids: t.ids ?? [],
    names: t.names ?? [],
    moves: t.moves ?? t.ids?.map(() => []) ?? [],
    ability: t.ability ?? t.ids?.map(() => "") ?? [],
    nature: t.nature ?? t.ids?.map(() => "") ?? [],
    evs:
      t.evs ??
      t.ids?.map(() => ({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 })) ??
      [],
  }));
}

export function saveTeam(
  name: string,
  members: { id: number; name: string }[],
  moves: string[][] = [],
  ability: string[] = [],
  nature: string[] = [],
  evs: EvSpread[] = [],
) {
  const teams = getSavedTeams().filter((t) => t.name !== name);
  teams.unshift({
    name,
    ids: members.map((m) => m.id),
    names: members.map((m) => m.name),
    moves,
    ability,
    nature,
    evs,
  });
  write(TEAM_KEY, teams.slice(0, 12));
  return teams;
}
