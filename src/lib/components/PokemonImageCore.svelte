<script lang="ts">
  import * as stylex from "@stylexjs/stylex";
  import type { ImageSx } from "$lib/styles/stylex-types";
  import { styles } from "./PokemonImageCore.styles";

  let {
    src,
    fallback,
    alt = "",
    sx,
    pixelated = false,
    lazy = true,
  }: {
    src: string;
    fallback?: string[];
    alt?: string;
    sx?: ImageSx;
    /** Render the image with hard edges instead of smoothing. */
    pixelated?: boolean;
    lazy?: boolean;
  } = $props();

  let loaded = $state(false);
  let failed = $state(false);
  let attempt = $state(0);

  const candidates = $derived([src, ...(fallback ?? [])]);

  const effectiveSrc = $derived(
    candidates[Math.min(attempt, candidates.length - 1)],
  );
</script>

{#if failed}
  <!-- Neutral tile: a white pokeball placeholder read as a bright dead-pixel
       spot against the dark page background. -->
  <div {...stylex.attrs(styles.placeholder, sx)}></div>
{:else}
  <!-- Keyed on the effective source: advancing the fallback chain recreates
       the element, so the browser always fires load for the new URL. -->
  {#key effectiveSrc}
    <img
      src={effectiveSrc}
      {alt}
      loading={lazy ? "lazy" : "eager"}
      onload={() => (loaded = true)}
      onerror={() => {
        if (attempt < candidates.length - 1) {
          attempt++;
        } else {
          loaded = true;
          failed = true;
        }
      }}
      {...stylex.attrs(
        styles.img,
        sx,
        loaded ? styles.loaded : styles.loading,
        pixelated && styles.pixelated,
      )}
    />
  {/key}
{/if}
