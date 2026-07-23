// ── Shared autocomplete loading + selection — used by Compare / Team Builder / Damage Calc ──
import { getAutocompleteList, getPokemonDetail } from "$lib/api";
import type { PokemonDetail } from "$lib/pokemon-types";

export function useAutocomplete() {
  let allNames = $state<{ name: string; id: number }[]>([]);
  let total = $state(0);

  async function init() {
    try {
      const catalog = await getAutocompleteList({});
      allNames = catalog.results;
      total = catalog.total;
    } catch {}
  }

  function search(
    query: string,
    exclude?: number[],
  ): { name: string; id: number }[] {
    const excludeSet = new Set(exclude ?? []);
    const q = query.trim().toLowerCase();
    const base = q
      ? allNames.filter(
          (n) => n.name.toLowerCase().includes(q) || String(n.id).includes(q),
        )
      : allNames;
    return base.filter((n) => !excludeSet.has(n.id)).slice(0, 10);
  }

  return {
    get allNames() {
      return allNames;
    },
    get total() {
      return total;
    },
    init,
    search,
    async loadDetail(name: string): Promise<PokemonDetail | null> {
      try {
        return await getPokemonDetail(name);
      } catch {
        return null;
      }
    },
  };
}
