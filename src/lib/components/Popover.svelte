<script lang="ts">
  import * as stylex from "@stylexjs/stylex";
  import type { PanelSx } from "$lib/styles/stylex-types";
  import { onDismiss } from "$lib/popup";
  import type { Snippet } from "svelte";
  import { styles } from "./Popover.styles";

  let {
    open,
    onClose,
    panelSx,
    trigger,
    panel,
  }: {
    /** Controlled visibility; the parent owns the state. */
    open: boolean;
    /** Called on outside click or Escape so the parent can close. */
    onClose: () => void;
    /** Sizing and shape for the floating panel: width, max-height, radius,
        padding, and edge alignment (for example `right: 0` to span outward
        from the host's left edge). */
    panelSx?: PanelSx;
    trigger: Snippet;
    panel: Snippet;
  } = $props();

  let host = $state<HTMLElement | undefined>();

  // Outside click or Escape asks the parent to close. Because the host wraps
  // the trigger too, pressing the trigger never counts as "outside" - its
  // own click handler toggles without a dismiss/reopen race.
  $effect(() => {
    if (!open) return;
    return onDismiss(host, onClose);
  });
</script>

<div bind:this={host} {...stylex.attrs(styles.host)}>
  {@render trigger()}
  {#if open}
    <div {...stylex.attrs(styles.panel, panelSx)}>
      {@render panel()}
    </div>
  {/if}
</div>
