import { TOTAL_SPECIES } from "$lib/pokemon-types";

const BACK_LABELS: Record<string, string> = {
  "/": "Pokédex",
  "/team-builder": "Team Builder",
  "/compare": "Compare",
  "/rankings": "Rankings",
  "/damage-calc": "Damage Calc",
};

export function backLabel(url: string | null): string {
  if (!url) return "Pokédex";
  const path = url.split("?")[0];
  return BACK_LABELS[path] ?? "Back";
}

/** Fallback path when the random Pokémon API call fails. */
export function randomFallbackPath(): `/pokemon/${number}` {
  return `/pokemon/${Math.floor(Math.random() * TOTAL_SPECIES) + 1}`;
}
