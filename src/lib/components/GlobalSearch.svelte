<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { onMount } from "svelte";
  import { getAutocompleteList } from "$lib/api";
  import { formatName, spriteUrl, tokenMatch } from "$lib/pokemon-types";

  let query = $state("");
  let open = $state(false);
  let highlight = $state(0);
  let options = $state<{ name: string; id: number }[]>([]);

  let suggestions = $derived.by(() => {
    const q = query.trim();
    if (!q) return [];
    return options.filter((o) => tokenMatch(q, o.name, o.id)).slice(0, 8);
  });

  onMount(() => {
    getAutocompleteList()
      .then(({ results }) => (options = results))
      .catch(() => {});
  });

  function select(name: string) {
    open = false;
    query = "";
    goto(resolve(`/pokemon/${name}`));
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      open = true;
      if (suggestions.length > 0)
        highlight = (highlight + 1) % suggestions.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length > 0)
        highlight = (highlight - 1 + suggestions.length) % suggestions.length;
    } else if (e.key === "Enter") {
      const s = suggestions[highlight];
      if (s) {
        e.preventDefault();
        select(s.name);
      }
    } else if (e.key === "Escape") {
      open = false;
    }
  }
</script>

<div class="relative w-full" data-global-search-root>
  <input
    type="search"
    bind:value={query}
    placeholder="Search any Pokémon..."
    aria-label="Search Pokémon"
    data-global-search
    onfocus={() => (open = true)}
    onblur={() => setTimeout(() => (open = false), 150)}
    onkeydown={onKeydown}
    class="ui-input w-full px-4 py-2 text-sm transition-all focus:shadow-lg"
    style="background: var(--input-bg)"
  />
  {#if open && suggestions.length > 0}
    <div
      class="absolute top-full left-0 z-30 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border py-1 shadow-2xl"
      style="background: var(--card); border-color: var(--border)"
    >
      {#each suggestions as s, i}
        <button
          type="button"
          onclick={() => select(s.name)}
          onmouseenter={() => (highlight = i)}
          class="flex w-full cursor-pointer items-center gap-3 border-0 px-3 py-1.5 text-left transition-colors"
          style="background: {i === highlight
            ? 'var(--surface-2)'
            : 'transparent'}; color: {i === highlight
            ? 'var(--text)'
            : 'var(--muted-strong)'}"
        >
          <img
            src={spriteUrl(s.id)}
            alt=""
            loading="lazy"
            class="size-9 shrink-0 object-contain"
          />
          <span class="truncate text-sm font-medium">{formatName(s.name)}</span>
          <span class="ml-auto shrink-0 text-xs" style="color: var(--muted)"
            >#{s.id}</span
          >
        </button>
      {/each}
    </div>
  {/if}
</div>
