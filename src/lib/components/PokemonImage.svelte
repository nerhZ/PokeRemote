<script lang="ts">
  import { spriteMode } from "$lib/sprite-mode.svelte";
  import PokemonImageCore from "./PokemonImageCore.svelte";

  let {
    src,
    id,
    alt = "",
    class: klass = "",
    style = "",
    lazy = true,
  }: {
    src: string;
    /** Pokemon id — when provided, the component honors global sprite mode
        internally (animated → classic sprite → artwork fallback). */
    id?: number;
    alt?: string;
    class?: string;
    style?: string;
    lazy?: boolean;
  } = $props();

  const sources = $derived(
    id != null ? spriteMode.thumbnail(id, src) : { src, fallback: [] },
  );

  const effectiveStyle = $derived(
    id != null && spriteMode.active
      ? `${style}${style ? "; " : ""}image-rendering: pixelated`
      : style,
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
    class={klass}
    style={effectiveStyle}
    {lazy}
  />
{/key}
