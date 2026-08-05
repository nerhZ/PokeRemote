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
  class="nav-link group cursor-pointer border-0 transition-all {mobile
    ? 'mt-2 block w-full text-left'
    : ''}"
>
  <!-- Gradient on a child span: bg-clip-text on the button itself would clip
       the nav-link hover highlight to the text, hiding the hover box. -->
  <span
    class="from-pokemon-red via-pokemon-yellow to-accent bg-linear-to-r bg-clip-text font-black tracking-wider text-transparent uppercase transition-all {spriteMode.active
      ? 'opacity-100 drop-shadow-[0_0_6px_rgba(255,203,5,0.55)]'
      : 'opacity-55 group-hover:opacity-100'}"
    >{spriteMode.active ? "⏸ Sprites" : "▶ Sprites"}</span
  >
</button>
