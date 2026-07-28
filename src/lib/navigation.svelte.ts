export const nav = $state<{ previousUrl: string | null }>({
  previousUrl: null,
});

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
