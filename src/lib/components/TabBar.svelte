<script lang="ts">
    interface Tab {
        id: string;
        label: string;
    }

    let { tabs, active, color = "#777", onchange }: {
        tabs: Tab[];
        active: string;
        color?: string;
        onchange: (id: string) => void;
    } = $props();
</script>

<div class="flex gap-1 overflow-x-auto mb-5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
    {#each tabs as t}
        <button
            onclick={() => onchange(t.id)}
            class="flex-1 min-w-18 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide cursor-pointer border-0 transition-all"
            style={active === t.id ? `background-color: ${color}33; color: #fff` : "background: transparent; color: var(--muted)"}
        >{t.label}</button>
    {/each}
</div>
