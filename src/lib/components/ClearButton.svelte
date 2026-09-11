<script lang="ts">
  import { page } from "$app/state";
  import * as stylex from "@stylexjs/stylex";
  import { styles } from "./ClearButton.styles";

  let { onclick }: { onclick: () => void } = $props();
</script>

{#if page.url.search}
  <button {onclick} {...stylex.attrs(styles.button)}>Clear</button>
{/if}
