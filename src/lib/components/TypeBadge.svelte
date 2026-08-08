<script lang="ts">
  import Tooltip from "./Tooltip.svelte";
  import TypeBadgeInner from "./TypeBadgeInner.svelte";
  import TypePopup from "./TypePopup.svelte";

  let {
    type,
    size = "sm",
    tooltip = true,
    position = "top",
    focusable = true,
  }: {
    type: string;
    size?: "xs" | "sm" | "md";
    tooltip?: boolean;
    position?: "top" | "bottom";
    /** Make the badge a tab stop (tooltip opens on focus). Dense grids opt
        out — thousands of tab stops would bury keyboard navigation. */
    focusable?: boolean;
  } = $props();
</script>

{#if tooltip}
  <Tooltip width="w-max" {position}>
    {#snippet popup()}
      <TypePopup {type} />
    {/snippet}
    {#snippet trigger()}
      <TypeBadgeInner {type} {size} tabindex={focusable ? 0 : undefined} />
    {/snippet}
  </Tooltip>
{:else}
  <TypeBadgeInner {type} {size} />
{/if}
