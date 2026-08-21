<script lang="ts">
  import { formatName } from "$lib/pokemon-types";
  import { onDismiss } from "$lib/popup";
  import type { Snippet } from "svelte";
  import TypeBadge from "./TypeBadge.svelte";

  export type DropdownOption = {
    value: string;
    label?: string;
    badge?: string;
    meta?: string;
    hint?: string;
  };

  let {
    open = $bindable(false),
    options,
    selected,
    onselect,
    onclear,
    placeholder = "None",
    buttonClass = "",
    searchable = false,
    button,
    /** Sizing for the host (button + panel share its width); e.g. `w-44` to
        keep a shrink-wrapped flex item from collapsing around short labels. */
    class: klass = "",
  }: {
    open?: boolean;
    options: DropdownOption[];
    selected: string;
    onselect: (value: string) => void;
    onclear?: () => void;
    placeholder?: string;
    buttonClass?: string;
    /** Show a filter input above the options (for long lists like moves). */
    searchable?: boolean;
    button?: Snippet<[string]>;
    class?: string;
  } = $props();

  let host: HTMLElement | undefined = $state();
  let filter = $state("");
  let highlight = $state(0);
  const uid = $props.id();

  const filteredOptions = $derived(
    searchable && filter.trim()
      ? options.filter((o) =>
          (o.label ?? formatName(o.value))
            .toLowerCase()
            .includes(filter.trim().toLowerCase()),
        )
      : options,
  );

  function toggle() {
    open = !open;
  }

  function pick(value: string) {
    onselect(value);
    open = false;
  }

  function clear() {
    onclear?.();
    open = false;
  }

  // Reset the filter and highlight whenever the panel (re)opens.
  $effect(() => {
    if (open) {
      filter = "";
      highlight = 0;
    }
  });

  // Keep the highlight inside the (possibly narrowed) option list.
  $effect(() => {
    if (open && highlight > filteredOptions.length - 1) {
      highlight = Math.max(0, filteredOptions.length - 1);
    }
  });

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        open = true;
        return;
      }
      const delta = e.key === "ArrowDown" ? 1 : -1;
      if (filteredOptions.length === 0) return;
      highlight =
        (highlight + delta + filteredOptions.length) % filteredOptions.length;
    } else if (e.key === "Enter" && open) {
      const opt = filteredOptions[highlight];
      if (opt) {
        e.preventDefault();
        pick(opt.value);
      }
    }
  }

  $effect(() => {
    if (!open) return;
    return onDismiss(host, () => (open = false));
  });
</script>

<div bind:this={host} class="relative {klass}">
  <button
    type="button"
    onclick={toggle}
    onkeydown={onKeydown}
    aria-haspopup="listbox"
    aria-expanded={open}
    class="w-full cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white/70 outline-none hover:border-white/20 {buttonClass}"
  >
    {#if button}
      {@render button(selected)}
    {:else}
      {options.find((o) => o.value === selected)?.label ??
        (selected ? formatName(selected) : placeholder)}
    {/if}
  </button>
  {#if open}
    <div
      role="listbox"
      aria-label={placeholder}
      class="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border bg-(--card) p-1 shadow-2xl"
      style="border-color: var(--border)"
    >
      {#if searchable}
        <input
          type="search"
          bind:value={filter}
          onkeydown={onKeydown}
          placeholder="Filter..."
          aria-label={`Filter ${placeholder.toLowerCase()}`}
          class="focus:border-accent/50 mb-1 w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/70 placeholder-white/30 outline-none"
        />
      {/if}
      {#if onclear}
        <button
          type="button"
          onclick={clear}
          role="option"
          aria-selected={selected === ""}
          class="w-full cursor-pointer rounded-lg border-0 bg-transparent px-3 py-2 text-left text-xs text-white/40 hover:bg-white/5"
          >None</button
        >
      {/if}
      {#each filteredOptions as o, i}
        <button
          type="button"
          onclick={() => pick(o.value)}
          onmouseenter={() => (highlight = i)}
          role="option"
          id={`dd-${uid}-opt-${i}`}
          aria-selected={selected === o.value}
          class="flex w-full flex-col gap-0.5 rounded-lg border-0 bg-transparent px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5 {selected ===
          o.value
            ? 'bg-white/10'
            : ''} {i === highlight ? 'bg-white/5' : ''}"
        >
          <span class="flex items-center gap-1.5">
            {#if o.badge}<TypeBadge
                type={o.badge}
                size="xs"
                tooltip={false}
              />{/if}
            <span class="truncate">{o.label ?? formatName(o.value)}</span>
            {#if o.meta}<span class="ml-auto shrink-0 text-[10px] text-white/30"
                >{o.meta}</span
              >{/if}
          </span>
          {#if o.hint}<span class="text-[10px] leading-tight text-white/30"
              >{o.hint}</span
            >{/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
