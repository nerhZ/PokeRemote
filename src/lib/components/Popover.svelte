<script lang="ts">
  import { onDismiss } from "$lib/popup";
  import type { Snippet } from "svelte";

  let {
    open,
    onClose,
    panelClass = "",
    trigger,
    panel,
  }: {
    /** Controlled visibility; the parent owns the state. */
    open: boolean;
    /** Called on outside click or Escape so the parent can close. */
    onClose: () => void;
    /** Sizing/shape classes for the floating panel: width, max-height,
        radius, padding, and edge alignment (e.g. `right-0` to span from the
        host's left edge outward). */
    panelClass?: string;
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

<div bind:this={host} class="relative">
  {@render trigger()}
  {#if open}
    <div
      class="absolute top-full left-0 z-30 mt-1 overflow-y-auto border bg-(--card) shadow-xl {panelClass}"
      style="border-color: var(--border)"
    >
      {@render panel()}
    </div>
  {/if}
</div>
