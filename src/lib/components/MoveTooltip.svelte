<script lang="ts">
  import { formatName } from "$lib/pokemon-types";
  import * as stylex from "@stylexjs/stylex";
  import AttackingMatchups from "./AttackingMatchups.svelte";
  import TypeBadge from "./TypeBadge.svelte";
  import Tooltip from "./Tooltip.svelte";
  import { styles } from "./MoveTooltip.styles";

  interface MoveTooltipData {
    name: string;
    type?: string | null;
    power?: number | null;
    accuracy?: number | null;
    pp?: number | null;
    effect?: string | null;
  }

  let {
    move,
    children,
  }: {
    move: MoveTooltipData;
    children?: import("svelte").Snippet;
  } = $props();
</script>

{#snippet defaultTrigger()}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex: tooltip trigger; focus reveals the popup -->
  <span tabindex="0" {...stylex.attrs(styles.trigger)}>
    {#if move.type}
      <TypeBadge type={move.type} size="xs" tooltip={false} link={false} />
    {/if}
    {formatName(move.name)}
  </span>
{/snippet}

<Tooltip popupSx={styles.moveTooltip}>
  {#snippet popup()}
    <div {...stylex.attrs(styles.title)}>
      {formatName(move.name)}
    </div>
    <div {...stylex.attrs(styles.line)}>
      Pow {move.power ?? "—"} / Acc {move.accuracy ?? "—"} / PP {move.pp ?? "—"}
    </div>
    {#if move.effect}
      <div {...stylex.attrs(styles.effect)}>{move.effect}</div>
    {/if}
    {#if move.type}
      <AttackingMatchups type={move.type} />
    {/if}
  {/snippet}
  {#snippet trigger()}
    {#if children}
      {@render children()}
    {:else}
      {@render defaultTrigger()}
    {/if}
  {/snippet}
</Tooltip>
