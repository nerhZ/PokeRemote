import { goto } from "$app/navigation";
import { page } from "$app/state";
import { resolve, base } from "$app/paths";
import { getRandomPokemon } from "$lib/api";
import { TOTAL_SPECIES } from "$lib/pokemon-types";

const BACK_LABELS: Record<string, string> = {
  "/": "Pokédex",
  "/team-builder": "Team Builder",
  "/compare": "Compare",
  "/rankings": "Rankings",
  "/damage-calc": "Damage Calc",
  "/items": "Items",
  "/abilities": "Abilities",
  "/moves": "Moves",
  "/type-chart": "Type Chart",
  "/quiz": "Quiz",
};

function backLabel(url: string | null): string {
  if (!url) return "Pokédex";
  const path = url.split("?")[0];
  return BACK_LABELS[path] ?? "Back";
}

/** Fallback path when the random Pokémon API call fails. */
function randomFallbackPath(): `/pokemon/${number}` {
  return `/pokemon/${Math.floor(Math.random() * TOTAL_SPECIES) + 1}`;
}

/** Back-navigation target and label resolved from the stored previous route. */
export function backTarget(raw: string | null): { url: string; label: string } {
  if (!raw) return { url: resolve("/"), label: "Pokédex" };
  return {
    url: base === "/" ? raw : base + raw,
    label: backLabel(raw),
  };
}

/** Whether the current route matches the given path. */
export function isActive(href: string): boolean {
  if (href === "/") return page.url.pathname === "/";
  return page.url.pathname.startsWith(href);
}

/** Navigate to a random Pokémon, falling back to a random species id. */
export async function gotoRandomPokemon() {
  try {
    const r = await getRandomPokemon();
    goto(resolve(`/pokemon/${r.name}`));
  } catch {
    goto(resolve(randomFallbackPath()));
  }
}
