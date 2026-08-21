<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { onMount } from "svelte";
  import { getAutocompleteList } from "$lib/api";
  import { formatName, spriteUrl, tokenMatch } from "$lib/pokemon-types";
  import PokemonImage from "./PokemonImage.svelte";

  interface Props {
    value?: string;
    placeholder?: string;
    options?: { name: string; id: number }[];
    disabled?: boolean;
    navigate?: boolean;
    globalSearch?: boolean;
    onselect?: (name: string) => void;
  }

  let {
    value = $bindable(""),
    placeholder = "Search Pokémon...",
    options,
    disabled = false,
    navigate = false,
    globalSearch = false,
    onselect,
  }: Props = $props();

  let open = $state(false);
  let highlight = $state(0);
  let internalOptions = $state<{ name: string; id: number }[]>([]);
  const uid = $props.id();
  const listboxId = `ps-${uid}-listbox`;

  const selfLoading = $derived(options === undefined);

  const source = $derived(options ?? internalOptions);

  /** Exact name matches first, then prefix matches, then the remaining
      token matches (id, substring); dex order breaks ties. Keeps short
      queries from putting an earlier-dex partial match ahead of the entry
      the user typed (e.g. "mew" must not land on Mewtwo). */
  let suggestions = $derived.by(() => {
    const q = value.trim().toLowerCase();
    if (!q) return selfLoading ? [] : source.slice(0, 10);
    const exact: { name: string; id: number }[] = [];
    const prefix: { name: string; id: number }[] = [];
    const rest: { name: string; id: number }[] = [];
    for (const o of source) {
      const name = o.name.toLowerCase();
      if (name === q) exact.push(o);
      else if (name.startsWith(q)) prefix.push(o);
      else if (tokenMatch(q, o.name, o.id)) rest.push(o);
    }
    return [...exact, ...prefix, ...rest].slice(0, 10);
  });

  /** Show the display name once the value is a full catalog entry (e.g. after
      selecting "charizard-mega-x"), while keeping the raw identifier as value. */
  let displayValue = $derived(
    value && source.some((o) => o.name === value) ? formatName(value) : value,
  );

  onMount(() => {
    if (selfLoading) {
      getAutocompleteList()
        .then(({ results }) => (internalOptions = results))
        .catch(() => {});
    }
  });

  $effect(() => {
    if (suggestions.length > 0 && highlight >= suggestions.length)
      highlight = 0;
  });

  function select(name: string) {
    open = false;
    onselect?.(name);
    if (navigate) {
      value = "";
      goto(resolve(`/pokemon/${name}`));
    }
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

<div class="relative w-full">
  <input
    type="search"
    {placeholder}
    value={displayValue}
    oninput={(e) => (value = (e.target as HTMLInputElement).value)}
    {disabled}
    data-global-search={globalSearch ? "" : undefined}
    onfocus={() => (open = true)}
    onblur={() => setTimeout(() => (open = false), 150)}
    onkeydown={onKeydown}
    role="combobox"
    aria-label={placeholder}
    aria-expanded={open && suggestions.length > 0}
    aria-autocomplete="list"
    aria-controls={listboxId}
    aria-activedescendant={open && suggestions.length > 0
      ? `${listboxId}-opt-${highlight}`
      : undefined}
    class="ui-input w-full px-4 py-2.5 text-sm transition-all outline-none focus:shadow-lg disabled:opacity-40"
    style="background: var(--input-bg)"
  />
  {#if open && suggestions.length > 0 && !disabled}
    <div
      id={listboxId}
      role="listbox"
      aria-label="Pokémon suggestions"
      class="absolute top-full left-0 z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border py-1 shadow-2xl"
      style="background: var(--card); border-color: var(--border)"
    >
      {#each suggestions as s, i}
        <button
          type="button"
          onclick={() => select(s.name)}
          onmouseenter={() => (highlight = i)}
          role="option"
          id={`${listboxId}-opt-${i}`}
          aria-selected={i === highlight}
          class="flex w-full cursor-pointer items-center gap-3 border-0 px-3 py-1.5 text-left transition-colors"
          style="background: {i === highlight
            ? 'var(--surface-2)'
            : 'transparent'}; color: {i === highlight
            ? 'var(--text)'
            : 'var(--muted-strong)'}"
        >
          <!-- Classic sprites are tiny; in sprite mode the id switches rows to
               animated GIFs (classic sprite as fallback). -->
          <PokemonImage
            src={spriteUrl(s.id)}
            id={s.id}
            alt=""
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
