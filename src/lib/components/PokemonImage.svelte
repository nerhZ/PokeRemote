<script lang="ts">
  import type { ImageSx } from "$lib/styles/stylex-types";
  import { spriteMode } from "$lib/sprite-mode.svelte";
  import PokemonImageCore from "./PokemonImageCore.svelte";

  let {
    src,
    id,
    alt = "",
    sx,
    lazy = true,
  }: {
    src: string;
    /** Pokemon id. When provided, the component honors global sprite mode
        internally (animated → classic sprite → artwork fallback). */
    id?: number;
    alt?: string;
    sx?: ImageSx;
    lazy?: boolean;
  } = $props();

  const sources = $derived(
    id != null ? spriteMode.thumbnail(id, src) : { src, fallback: [] },
  );
</script>

<!-- Keyed on the primary source: a source change recreates the core (fresh
     fade-in + fresh fallback chain), so a reused <img> never has to swallow a
     re-assigned (cached) URL without firing load. -->
{#key sources.src}
  <PokemonImageCore
    src={sources.src}
    fallback={sources.fallback}
    {alt}
    {sx}
    pixelated={id != null && spriteMode.active}
    {lazy}
  />
{/key}
