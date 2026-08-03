import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { getAutocompleteList, getPokemonDetail } from "$lib/api";
import type { PokemonDetail } from "$lib/pokemon-types";

/** Shared query-param sync + clear behavior for tool pages. */
export function pageUrlSync(
  path: "/compare" | "/damage-calc" | "/team-builder",
) {
  const base = resolve(path);
  return {
    push(params: URLSearchParams) {
      const q = params.toString();
      goto(q ? `${base}?${q}` : base, {
        replaceState: true,
        keepFocus: true,
        noScroll: true,
      });
    },
    clear() {
      localStorage.removeItem(`pageState:${base}`);
      goto(base, { replaceState: true });
    },
  };
}

/** Full Pokémon catalog (forms) with its live count, or empty on failure. */
export async function getCatalog(): Promise<{
  results: { name: string; id: number }[];
  total: number;
}> {
  try {
    const catalog = await getAutocompleteList();
    return { results: catalog.results, total: catalog.total };
  } catch {
    return { results: [], total: 0 };
  }
}

/**
 * Standard "select a Pokémon slot" flow: sets loading, fetches the detail,
 * drops stale responses via the effect-generation guard, then applies.
 */
export async function selectPokemonSlot(
  name: string,
  opts: {
    gen?: number;
    effectGen?: number;
    setLoading: (loading: boolean) => void;
    apply: (pokemon: PokemonDetail) => void | Promise<void>;
  },
) {
  opts.setLoading(true);
  try {
    const pokemon = await getPokemonDetail(name);
    if (
      opts.gen !== undefined &&
      opts.effectGen !== undefined &&
      opts.gen !== opts.effectGen
    )
      return;
    await opts.apply(pokemon);
  } catch {
    // failed or stale load; page state unchanged
  } finally {
    opts.setLoading(false);
  }
}
