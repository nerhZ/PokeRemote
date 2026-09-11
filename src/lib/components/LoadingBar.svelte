<script lang="ts">
  import * as stylex from "@stylexjs/stylex";
  import { navigating } from "$app/state";
  import { pageLoading } from "$lib/loading-state.svelte";
  import { styles } from "./LoadingBar.styles";

  let visible = $state(false);
  let showTimer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    if (navigating.to !== null || pageLoading.active) {
      showTimer = setTimeout(() => (visible = true), 120);
      return () => clearTimeout(showTimer);
    }
    visible = false;
  });
</script>

{#if visible}
  <div {...stylex.attrs(styles.track)}>
    <div {...stylex.attrs(styles.fill)}></div>
  </div>
{/if}
