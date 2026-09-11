<script lang="ts">
  import * as stylex from "@stylexjs/stylex";
  import EvolutionChain from "./EvolutionChain.svelte";
  import { type EvolutionStage, formatName } from "$lib/pokemon-types";
  import { resolve } from "$app/paths";
  import PokemonImage from "./PokemonImage.svelte";
  import { dynamic } from "../styles/dynamic.stylex";
  import { styles } from "./EvolutionChain.styles";

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
  <div {...stylex.attrs(styles.root)}>
    <a
      href={resolve(`/pokemon/${stage.name}`)}
      {...stylex.attrs(styles.link, stylex.defaultMarker())}
    >
      <div
        {...stylex.attrs(
          styles.thumb,
          stage.name === currentName
            ? dynamic.boxShadow(`0 0 0 2px ${color}`)
            : null,
        )}
      >
        <PokemonImage
          src={stage.image}
          id={stage.id}
          alt={stage.name}
          lazy={false}
          sx={styles.image}
        />
      </div>
      <span
        {...stylex.attrs(
          styles.name,
          stage.name !== currentName && styles.nameIdle,
          stage.name === currentName ? dynamic.color(color) : null,
        )}>{formatName(stage.name)}</span
      >
    </a>
    {#if stage.children.length > 0}
      <div {...stylex.attrs(styles.children)}>
        {#each stage.children as child}
          <div {...stylex.attrs(styles.childRow)}>
            <div {...stylex.attrs(styles.condition)}>
              <span {...stylex.attrs(styles.arrow)}>↓</span>
              <span {...stylex.attrs(styles.conditionText)}
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
