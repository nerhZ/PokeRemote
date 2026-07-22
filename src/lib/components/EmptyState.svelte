<script lang="ts">
    let { title, subtitle = "", actionLabel = "", onaction }: { title: string; subtitle?: string; actionLabel?: string; onaction?: () => void } = $props();
</script>

<div class="flex flex-col items-center justify-center py-20 text-center px-6">
    <div class="w-24 h-24 mb-6 relative">
        <div class="absolute inset-0 rounded-full border-4 border-slate-700 bg-gradient-to-b from-pokemon-red from-50% to-white to-50% opacity-80"></div>
        <div class="absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -translate-y-1/2"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-4 border-slate-800 bg-white"></div>
    </div>
    <p class="font-semibold text-lg mb-1" style="color: var(--text)">{title}</p>
    {#if subtitle}<p class="text-sm max-w-sm" style="color: var(--muted)">{subtitle}</p>{/if}
    {#if actionLabel && onaction}
        <button onclick={onaction} class="mt-6 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/80 text-white text-sm font-semibold cursor-pointer transition-colors border-0">{actionLabel}</button>
    {/if}
</div>
