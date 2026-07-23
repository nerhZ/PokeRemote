<script lang="ts">
  import {
    type PokemonDetail,
    formatName,
    STAT_LABELS,
  } from "$lib/pokemon-types";
  let {
    pokemon,
    color = "#777",
    overlay,
    overlayColor = "#555",
  }: {
    pokemon: PokemonDetail;
    color?: string;
    overlay?: PokemonDetail;
    overlayColor?: string;
  } = $props();

  const cx = 100,
    cy = 100,
    maxR = 80;

  function statPoints(stats: { name: string; base_stat: number }[]) {
    return stats
      .map((s, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 3;
        const r = (s.base_stat / 255) * maxR;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      })
      .join(" ");
  }

  let polygon = $derived(statPoints(pokemon.stats));
  let overlayPolygon = $derived(overlay ? statPoints(overlay.stats) : "");

  let gridRings = $derived(
    [0.25, 0.5, 0.75, 1].map((lvl) =>
      Array.from({ length: 6 }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 3;
        const r = maxR * lvl;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }).join(" "),
    ),
  );
</script>

<svg viewBox="0 0 200 200" class="mx-auto w-full">
  {#each gridRings as ring}
    <polygon
      points={ring}
      fill="none"
      style="stroke: var(--chart-grid)"
      stroke-width="1"
    />
  {/each}
  {#each Array(6) as _, i}
    {@const a = -Math.PI / 2 + (i * Math.PI) / 3}
    <line
      x1={cx}
      y1={cy}
      x2={cx + maxR * Math.cos(a)}
      y2={cy + maxR * Math.sin(a)}
      style="stroke: var(--chart-grid)"
      stroke-width="1"
    />
  {/each}
  <polygon
    points={polygon}
    fill="{color}30"
    stroke={color}
    stroke-width="2"
    stroke-linejoin="round"
  />
  {#if overlay}
    <polygon
      points={overlayPolygon}
      fill="{overlayColor}20"
      stroke={overlayColor}
      stroke-width="2"
      stroke-dasharray="4 2"
    />
  {/if}
  {#each pokemon.stats as stat, i}
    {@const a = -Math.PI / 2 + (i * Math.PI) / 3}
    {@const lx = cx + 92 * Math.cos(a)}
    {@const ly = cy + 92 * Math.sin(a)}
    <text
      x={lx}
      y={ly}
      text-anchor="middle"
      dominant-baseline="middle"
      style="fill: var(--chart-label)"
      font-size="8"
      font-weight="700">{STAT_LABELS[stat.name]}</text
    >
  {/each}
</svg>
{#if overlay}
  <div class="mt-2 flex justify-center gap-4 text-xs">
    <span style="color: {color}">● {formatName(pokemon.name)}</span>
    <span style="color: {overlayColor}">○ {formatName(overlay.name)}</span>
  </div>
{/if}
