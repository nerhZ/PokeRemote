<script lang="ts">
  interface Tab {
    id: string;
    label: string;
  }

  let {
    tabs,
    active,
    color = "#777",
    onchange,
  }: {
    tabs: Tab[];
    active: string;
    color?: string;
    onchange: (id: string) => void;
  } = $props();
</script>

<div
  role="tablist"
  class="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-white/6 bg-white/3 p-1"
>
  {#each tabs as t, i}
    <button
      role="tab"
      aria-selected={active === t.id}
      onclick={() => onchange(t.id)}
      onkeydown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          const dir = e.key === "ArrowRight" ? 1 : -1;
          onchange(tabs[(i + dir + tabs.length) % tabs.length].id);
        }
      }}
      class="min-w-18 flex-1 cursor-pointer rounded-xl border-0 px-3 py-2 text-xs font-bold tracking-wide uppercase transition-all"
      style={active === t.id
        ? `background-color: ${color}33; color: #fff`
        : "background: transparent; color: var(--muted)"}>{t.label}</button
    >
  {/each}
</div>
