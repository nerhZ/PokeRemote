<script lang="ts">
  import Pokeball from "./Pokeball.svelte";

  let {
    src,
    fallback,
    alt = "",
    class: klass = "",
    style = "",
    lazy = true,
  }: {
    src: string;
    fallback?: string[];
    alt?: string;
    class?: string;
    style?: string;
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
  <div class="{klass} flex items-center justify-center" {style}>
    <Pokeball class="h-1/2 w-1/2 opacity-40" />
  </div>
{:else}
  <!-- Keyed on the effective source: advancing the fallback chain recreates
       the element, so the browser always fires load for the new URL. -->
  {#key effectiveSrc}
    <img
      src={effectiveSrc}
      {alt}
      {style}
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
      class="{klass} transition-opacity duration-300 {loaded
        ? 'opacity-100'
        : 'opacity-0'}"
    />
  {/key}
{/if}
