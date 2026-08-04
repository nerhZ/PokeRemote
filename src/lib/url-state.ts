import { goto } from "$app/navigation";
import { page } from "$app/state";
import { resolve } from "$app/paths";
import { getPokemonDetail } from "$lib/api";
import type { PokemonDetail } from "$lib/pokemon-types";

/** Shared query-param sync + clear behavior for tool pages. */
export function pageUrlSync(
  path: "/" | "/compare" | "/damage-calc" | "/team-builder",
) {
  const base = resolve(path);
  /** Matches the key the layout writes under `pageState:${pathname}` (base-aware). */
  const clearPageState = () => {
    localStorage.removeItem(`pageState:${page.url.pathname}`);
  };
  return {
    push(params: URLSearchParams) {
      const q = params.toString();
      goto(q ? `${base}?${q}` : base, {
        replaceState: true,
        keepFocus: true,
        noScroll: true,
      });
    },
    /**
     * Push the given params, preserving any other current query params.
     * Keys in `deleteKeys` are removed from the merged result.
     */
    pushMerged(params: URLSearchParams, deleteKeys: string[] = []) {
      const merged = new URLSearchParams(window.location.search);
      for (const key of deleteKeys) merged.delete(key);
      for (const [key, value] of params) merged.set(key, value);
      this.push(merged);
    },
    clear() {
      clearPageState();
      goto(base, { replaceState: true });
    },
    clearPageState,
  };
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
