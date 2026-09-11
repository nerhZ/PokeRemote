<script lang="ts">
  import * as stylex from "@stylexjs/stylex";
  import Pokeball from "./Pokeball.svelte";
  import { styles } from "./EmptyState.styles";

  let {
    title,
    subtitle = "",
    actionLabel = "",
    onaction,
  }: {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onaction?: () => void;
  } = $props();
</script>

<div {...stylex.attrs(styles.root)}>
  <Pokeball sx={styles.pokeball} />
  <p {...stylex.attrs(styles.title)}>{title}</p>
  {#if subtitle}<p {...stylex.attrs(styles.subtitle)}>
      {subtitle}
    </p>{/if}
  {#if actionLabel && onaction}
    <button onclick={onaction} {...stylex.attrs(styles.action)}
      >{actionLabel}</button
    >
  {/if}
</div>
