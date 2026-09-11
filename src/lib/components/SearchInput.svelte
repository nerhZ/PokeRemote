<script lang="ts">
  import * as stylex from "@stylexjs/stylex";
  import type { BoxSx } from "$lib/styles/stylex-types";
  import { styles } from "./SearchInput.styles";

  let {
    value = $bindable(""),
    placeholder = "Search...",
    sx,
  }: {
    value?: string;
    placeholder?: string;
    sx?: BoxSx;
  } = $props();
</script>

<input
  type="search"
  bind:value
  {placeholder}
  aria-label={placeholder}
  {...stylex.attrs(styles.input, sx)}
/>
