<script lang="ts">
  import { resolve } from "$app/paths";
  import * as stylex from "@stylexjs/stylex";
  import Tooltip from "./Tooltip.svelte";
  import TypeBadgeInner from "./TypeBadgeInner.svelte";
  import TypePopup from "./TypePopup.svelte";
  import { styles } from "./TypeBadge.styles";

  let {
    type,
    size = "sm",
    tooltip = true,
    position = "top",
    focusable = true,
    link = true,
  }: {
    type: string;
    size?: "xs" | "sm" | "md";
    tooltip?: boolean;
    position?: "top" | "bottom";
    /** Make the badge a tab stop (tooltip opens on focus). Dense grids opt
        out; thousands of tab stops would bury keyboard navigation. */
    focusable?: boolean;
    /** Link to the type-filtered Pokédex. Off when the badge sits inside
        another link or button, where a nested anchor is invalid. */
    link?: boolean;
  } = $props();
</script>

{#snippet badge()}
  <TypeBadgeInner {type} {size} />
{/snippet}

{#if link}
  <a
    href={resolve("/") + `?type=${type}`}
    tabindex={focusable ? undefined : -1}
    {...stylex.attrs(styles.link)}
  >
    {#if tooltip}
      <Tooltip popupSx={styles.tooltip} {position}>
        {#snippet popup()}
          <TypePopup {type} />
        {/snippet}
        {#snippet trigger()}
          {@render badge()}
        {/snippet}
      </Tooltip>
    {:else}
      {@render badge()}
    {/if}
  </a>
{:else if tooltip}
  <Tooltip popupSx={styles.tooltip} {position}>
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
