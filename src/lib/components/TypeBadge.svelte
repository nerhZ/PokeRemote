<script lang="ts">
  import { TYPE_COLORS } from "$lib/pokemon-types";
  import Tooltip from "./Tooltip.svelte";
  import AttackingMatchups from "./AttackingMatchups.svelte";

  let {
    type,
    size = "sm",
    tooltip = true,
    position = "top",
  }: {
    type: string;
    size?: "xs" | "sm" | "md";
    tooltip?: boolean;
    position?: "top" | "bottom";
  } = $props();

  const sizes = {
    xs: "px-2 py-0.5 text-[9px]",
    sm: "px-2.5 py-1 text-[10px]",
    md: "px-4 py-1.5 text-xs",
  };
</script>

{#snippet badgeSpan()}
  <span
    class="rounded-full font-bold tracking-wide text-white uppercase shadow-sm {sizes[
      size
    ]}"
    style="background-color: {TYPE_COLORS[type] || '#777'}">{type}</span
  >
{/snippet}

{#if tooltip}
  <Tooltip width="w-max" {position}>
    {#snippet popup()}
      <div
        class="mb-1 block font-semibold capitalize"
        style="color: var(--text)"
      >
        {type}
      </div>
      <AttackingMatchups {type} />
    {/snippet}
    {#snippet trigger()}
      {@render badgeSpan()}
    {/snippet}
  </Tooltip>
{:else}
  {@render badgeSpan()}
{/if}
