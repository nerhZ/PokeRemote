<script lang="ts">
  import { spriteMode } from "$lib/sprite-mode.svelte";
  import * as stylex from "@stylexjs/stylex";
  import { shared } from "$lib/styles/shared.stylex";
  import { styles } from "./SpriteToggle.styles";

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
  {...stylex.attrs(
    shared.navLink,
    styles.toggle,
    mobile && styles.toggleMobile,
    stylex.defaultMarker(),
  )}
>
  <!-- Gradient on a child span: bg-clip-text on the button itself would clip
       the nav-link hover highlight to the text, hiding the hover box. -->
  <span {...stylex.attrs(styles.label, spriteMode.active && styles.labelActive)}
    >{spriteMode.active ? "⏸ Sprites" : "▶ Sprites"}</span
  >
</button>
