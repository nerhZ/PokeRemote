<script lang="ts">
  import EvolutionChain from "./EvolutionChain.svelte";
  import { type EvolutionStage } from "$lib/pokemon-types";
  import { formatName } from "$lib/pokemon-types";
  import { resolve } from "$app/paths";

  let {
    stage,
    currentName,
    color = "#777",
  }: {
    stage: EvolutionStage | null;
    currentName: string;
    color?: string;
  } = $props();

  function describe(s: EvolutionStage): string {
    const parts: string[] = [];
    if (s.min_level != null && s.min_level > 0)
      parts.push(`Level ${s.min_level}`);
    if (s.item) parts.push(`Use ${formatName(s.item)}`);
    if (s.min_happiness != null && s.min_happiness > 0)
      parts.push(`Happiness ${s.min_happiness}+`);
    if (s.time_of_day) parts.push(`During ${s.time_of_day}`);
    if (s.held_item && s.held_item !== s.item)
      parts.push(`Hold ${formatName(s.held_item)}`);
    if (s.known_move) parts.push(`Know ${formatName(s.known_move)}`);
    if (s.location) parts.push(`At ${formatName(s.location)}`);
    if (s.trade_species) parts.push(`Trade for ${formatName(s.trade_species)}`);
    if (s.trigger === "trade" && !s.trade_species) parts.push("Trade");
    if (s.needs_overworld_rain) parts.push("In rain");
    if (s.gender != null)
      parts.push(s.gender === 1 ? "Female only" : "Male only");
    if (s.known_move_type)
      parts.push(`${formatName(s.known_move_type)}-type move`);
    if (s.min_affection != null) parts.push(`Affection ${s.min_affection}+`);
    if (s.relative_physical_stats != null) {
      if (s.relative_physical_stats === 0) parts.push("Atk = Def");
      else if (s.relative_physical_stats === 1) parts.push("Atk > Def");
      else parts.push("Atk < Def");
    }
    if (s.turn_upside_down) parts.push("Turn console upside down");
    return parts.length > 0 ? parts.join(" · ") : "???";
  }
</script>

{#if stage}
  <div class="flex flex-col items-center gap-2">
    <a
      href={resolve(`/pokemon/${stage.name}`)}
      class="group flex flex-col items-center gap-1.5 no-underline"
    >
      <div
        class="h-20 w-20 rounded-2xl border border-white/6 bg-white/3 p-2 transition-all group-hover:-translate-y-1"
        style={stage.name === currentName
          ? `box-shadow: 0 0 0 2px ${color}`
          : ""}
      >
        <img
          src={stage.image}
          alt={stage.name}
          class="h-full w-full object-contain"
        />
      </div>
      <span
        class="text-xs font-semibold"
        style={stage.name === currentName
          ? `color: ${color}`
          : "color: var(--muted)"}>{formatName(stage.name)}</span
      >
    </a>
    {#if stage.children.length > 0}
      <div class="flex flex-wrap items-start justify-center gap-4">
        {#each stage.children as child}
          <div class="flex flex-col items-center gap-1">
            <div class="flex flex-col items-center px-1">
              <span class="text-white/25">↓</span>
              <span
                class="max-w-18 text-center text-[10px] leading-tight text-white/40"
                >{describe(child)}</span
              >
            </div>
            <EvolutionChain stage={child} {currentName} {color} />
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
