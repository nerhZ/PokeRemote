<script lang="ts">
  import * as stylex from "@stylexjs/stylex";
  import type { ButtonSx, PopupSx } from "$lib/styles/stylex-types";
  import { formatName } from "$lib/pokemon-types";
  import { onDismiss } from "$lib/popup";
  import type { Snippet } from "svelte";
  import TypeBadge from "./TypeBadge.svelte";
  import { styles } from "./Dropdown.styles";

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
    buttonSx,
    searchable = false,
    button,
    /** Sizing for the host. The button and panel share its width, so pass a
        width style (for example `{ width: "11rem" }`) to keep a
        shrink-wrapped flex item from collapsing around short labels. */
    sx,
  }: {
    open?: boolean;
    options: DropdownOption[];
    selected: string;
    onselect: (value: string) => void;
    onclear?: () => void;
    placeholder?: string;
    buttonSx?: ButtonSx;
    /** Show a filter input above the options (for long lists like moves). */
    searchable?: boolean;
    button?: Snippet<[string]>;
    sx?: PopupSx;
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

<div bind:this={host} {...stylex.attrs(styles.host, sx)}>
  <button
    type="button"
    onclick={toggle}
    onkeydown={onKeydown}
    aria-haspopup="listbox"
    aria-expanded={open}
    {...stylex.attrs(styles.button, buttonSx)}
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
      {...stylex.attrs(styles.panel)}
    >
      {#if searchable}
        <input
          type="search"
          bind:value={filter}
          onkeydown={onKeydown}
          placeholder="Filter..."
          aria-label={`Filter ${placeholder.toLowerCase()}`}
          {...stylex.attrs(styles.search)}
        />
      {/if}
      {#if onclear}
        <button
          type="button"
          onclick={clear}
          role="option"
          aria-selected={selected === ""}
          {...stylex.attrs(styles.clear)}>None</button
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
          {...stylex.attrs(
            styles.option,
            i === highlight && styles.optionHighlighted,
            selected === o.value && styles.optionSelected,
          )}
        >
          <span {...stylex.attrs(styles.optionRow)}>
            {#if o.badge}<TypeBadge
                type={o.badge}
                size="xs"
                tooltip={false}
              />{/if}
            <span {...stylex.attrs(styles.optionLabel)}
              >{o.label ?? formatName(o.value)}</span
            >
            {#if o.meta}<span {...stylex.attrs(styles.optionMeta)}
                >{o.meta}</span
              >{/if}
          </span>
          {#if o.hint}<span {...stylex.attrs(styles.optionHint)}>{o.hint}</span
            >{/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
