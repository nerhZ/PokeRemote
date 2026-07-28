<script lang="ts">
  import { formatName } from "$lib/pokemon-types";
  import AttackingMatchups from "./AttackingMatchups.svelte";
  import TypeBadge from "./TypeBadge.svelte";
  import Tooltip from "./Tooltip.svelte";

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
  <span
    class="inline-flex items-center gap-1 rounded-full border border-white/6 bg-white/3 px-2 py-0.5 text-[11px]"
  >
    {#if move.type}
      <TypeBadge type={move.type} size="xs" tooltip={false} />
    {/if}
    {formatName(move.name)}
  </span>
{/snippet}

<Tooltip width="w-max">
  {#snippet popup()}
    <div class="mb-1 block font-semibold" style="color: var(--text)">
      {formatName(move.name)}
    </div>
    <div class="block">
      Pow {move.power ?? "—"} / Acc {move.accuracy ?? "—"} / PP {move.pp ?? "—"}
    </div>
    {#if move.effect}
      <div class="mt-1 block">{move.effect}</div>
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
