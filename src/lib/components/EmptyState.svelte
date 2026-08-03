<script lang="ts">
  import Pokeball from "./Pokeball.svelte";

  let {
    title,
    subtitle = "",
    actionLabel = "",
    onaction,
  }: {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onaction?: () => void;
  } = $props();
</script>

<div class="flex flex-col items-center justify-center px-6 py-20 text-center">
  <Pokeball class="mb-6 h-24 w-24" />
  <p class="mb-1 text-lg font-semibold" style="color: var(--text)">{title}</p>
  {#if subtitle}<p class="max-w-sm text-sm" style="color: var(--muted)">
      {subtitle}
    </p>{/if}
  {#if actionLabel && onaction}
    <button
      onclick={onaction}
      class="bg-accent hover:bg-accent/80 mt-6 cursor-pointer rounded-xl border-0 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
      >{actionLabel}</button
    >
  {/if}
</div>
