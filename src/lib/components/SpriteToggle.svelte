<script lang="ts">
  import { spriteMode } from "$lib/sprite-mode.svelte";

  let {
    mobile = false,
    onclick = () => {},
  }: {
    mobile?: boolean;
    onclick?: () => void;
  } = $props();
</script>

<button
  type="button"
  onclick={() => {
    spriteMode.toggle();
    onclick();
  }}
  aria-pressed={spriteMode.active}
  title="Toggle animated sprite thumbnails"
  class="from-pokemon-red via-pokemon-yellow to-accent nav-link cursor-pointer border-0 bg-linear-to-r bg-clip-text font-black tracking-wider text-transparent uppercase transition-all {mobile
    ? 'mt-2 block w-full text-left'
    : ''} {spriteMode.active
    ? 'opacity-100 drop-shadow-[0_0_6px_rgba(255,203,5,0.55)]'
    : 'opacity-55'}"
  >{mobile && spriteMode.active ? "✓ Sprites on" : "▶ Sprites"}</button
>
