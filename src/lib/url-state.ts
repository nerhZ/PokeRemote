import { goto } from "$app/navigation";
import { page } from "$app/state";
import { resolve } from "$app/paths";
import { getPokemonDetail } from "$lib/api";
import { formatName, type PokemonDetail } from "$lib/pokemon-types";

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
 * Failures surface through `onError` so pages can show feedback instead of
 * silently stopping the spinner.
 */
export async function selectPokemonSlot(
  name: string,
  opts: {
    gen?: number;
    effectGen?: number;
    setLoading: (loading: boolean) => void;
    apply: (pokemon: PokemonDetail) => void | Promise<void>;
    onError?: (message: string) => void;
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
    // A failed load leaves the slot empty; tell the page so the user gets
    // feedback (and a path to retry) instead of a silent spinner stop.
    opts.onError?.(
      `Couldn't load ${formatName(name)} — check your connection and try again.`,
    );
  } finally {
    opts.setLoading(false);
  }
}
