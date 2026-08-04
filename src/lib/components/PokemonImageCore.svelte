<script lang="ts">
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
  <!-- Neutral tile: a white pokeball placeholder read as a bright dead-pixel
       spot against the dark page background. -->
  <div class="{klass} rounded-lg bg-white/5" {style}></div>
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
