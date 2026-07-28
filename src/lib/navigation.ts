const BACK_LABELS: Record<string, string> = {
  "/": "Pokédex",
  "/team-builder": "Team Builder",
  "/compare": "Compare",
  "/rankings": "Rankings",
  "/damage-calc": "Damage Calc",
};

export function backLabel(fromParam: string | null): string {
  if (!fromParam) return "Pokédex";
  const path = fromParam.split("?")[0];
  return BACK_LABELS[path] ?? "Back";
}

export function fromPath(pathname: string, search: string): string {
  return encodeURIComponent(pathname + search);
}
