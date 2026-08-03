<script lang="ts">
  import Tooltip from "./Tooltip.svelte";
  import TypeBadgeInner from "./TypeBadgeInner.svelte";
  import TypePopup from "./TypePopup.svelte";

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
</script>

{#if tooltip}
  <Tooltip width="w-max" {position}>
    {#snippet popup()}
      <TypePopup {type} />
    {/snippet}
    {#snippet trigger()}
      <TypeBadgeInner {type} {size} />
    {/snippet}
  </Tooltip>
{:else}
  <TypeBadgeInner {type} {size} />
{/if}
