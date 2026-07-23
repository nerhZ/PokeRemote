<script lang="ts">
  import { formatName } from "$lib/pokemon-types";

  interface Props {
    value?: string;
    placeholder?: string;
    options: { name: string; id: number }[];
    disabled?: boolean;
    onselect: (name: string) => void;
  }

  let {
    value = $bindable(""),
    placeholder = "Search Pokémon...",
    options,
    disabled = false,
    onselect,
  }: Props = $props();
  let open = $state(false);

  let suggestions = $derived.by(() => {
    const q = value.trim().toLowerCase();
    const list = q
      ? options.filter(
          (n) => n.name.toLowerCase().includes(q) || String(n.id).includes(q),
        )
      : options;
    return list.slice(0, 10);
  });
</script>

<div class="relative">
  <input
    type="text"
    {placeholder}
    bind:value
    {disabled}
    onfocus={() => (open = true)}
    onblur={() => setTimeout(() => (open = false), 150)}
    onkeydown={(e) => {
      if (e.key === "Enter" && suggestions[0]) {
        e.preventDefault();
        onselect(suggestions[0].name);
        open = false;
      }
    }}
    class="w-full rounded-xl border px-4 py-3 transition-all outline-none disabled:opacity-40"
    style="background: var(--input-bg); border-color: var(--border); color: var(--text)"
  />
  {#if open && suggestions.length > 0 && !disabled}
    <div
      class="absolute z-30 mt-1 max-h-60 w-full overflow-hidden overflow-y-auto rounded-xl border shadow-2xl"
      style="background: var(--card); border-color: var(--border)"
    >
      {#each suggestions as s}
        <button
          type="button"
          onclick={() => {
            value = s.name;
            open = false;
            onselect(s.name);
          }}
          class="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-4 py-2.5 text-left text-sm transition-colors"
          style="color: var(--muted-strong)"
          onmouseenter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "var(--surface-2)";
            (e.currentTarget as HTMLElement).style.color = "var(--text)";
          }}
          onmouseleave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color =
              "var(--muted-strong)";
          }}
        >
          <span class="truncate">{formatName(s.name)}</span>
          <span class="shrink-0 text-xs" style="color: var(--muted)"
            >#{s.id}</span
          >
        </button>
      {/each}
    </div>
  {/if}
</div>
