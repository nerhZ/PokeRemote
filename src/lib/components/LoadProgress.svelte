<script lang="ts">
  import * as stylex from "@stylexjs/stylex";
  import Pokeball from "./Pokeball.svelte";
  import { dynamic } from "../styles/dynamic.stylex";
  import { styles } from "./LoadProgress.styles";

  let {
    done,
    total,
    noun = "",
    children,
  }: {
    done: number;
    total: number;
    /** What is being loaded, appended to "Loading x / y" (e.g. "species"). */
    noun?: string;
    /** Shown instead of the progress bar while no totals are known yet. */
    children?: import("svelte").Snippet;
  } = $props();
</script>

<div {...stylex.attrs(styles.root)}>
  <Pokeball sx={styles.pokeball} spinning />
  {#if total > 0}
    <p {...stylex.attrs(styles.label)}>
      Loading {done} / {total}{noun ? ` ${noun}` : ""}...
    </p>
    <div {...stylex.attrs(styles.track)}>
      <div
        {...stylex.attrs(
          styles.fill,
          dynamic.width(`${(done / (total || 1)) * 100}%`),
        )}
      ></div>
    </div>
  {:else if children}
    {@render children()}
  {/if}
</div>
