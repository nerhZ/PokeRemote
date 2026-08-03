<script lang="ts">
  import { formatName } from "$lib/pokemon-types";
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
    button,
  }: {
    open?: boolean;
    options: DropdownOption[];
    selected: string;
    onselect: (value: string) => void;
    onclear?: () => void;
    placeholder?: string;
    buttonClass?: string;
    button?: Snippet<[string]>;
  } = $props();

  let host: HTMLElement | undefined = $state();

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

  $effect(() => {
    if (!open) return;
    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") open = false;
    }
    function onPointerDown(e: PointerEvent) {
      if (host && !host.contains(e.target as Node)) open = false;
    }
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  });
</script>

<div bind:this={host} class="relative">
  <button
    type="button"
    onclick={toggle}
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
      class="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border bg-(--card) p-1 shadow-2xl"
      style="border-color: var(--border)"
    >
      {#if onclear}
        <button
          type="button"
          onclick={clear}
          class="w-full cursor-pointer rounded-lg border-0 bg-transparent px-3 py-2 text-left text-xs text-white/40 hover:bg-white/5"
          >None</button
        >
      {/if}
      {#each options as o}
        <button
          type="button"
          onclick={() => pick(o.value)}
          class="flex w-full flex-col gap-0.5 rounded-lg border-0 bg-transparent px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5 {selected ===
          o.value
            ? 'bg-white/10'
            : ''}"
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
