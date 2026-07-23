<script lang="ts">
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
  <div class="relative mb-6 h-24 w-24">
    <div
      class="from-pokemon-red absolute inset-0 rounded-full border-4 border-slate-700 bg-linear-to-b from-50% to-white to-50% opacity-80"
    ></div>
    <div
      class="absolute top-1/2 right-0 left-0 h-1 -translate-y-1/2 bg-slate-800"
    ></div>
    <div
      class="absolute top-1/2 left-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-slate-800 bg-white"
    ></div>
  </div>
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
