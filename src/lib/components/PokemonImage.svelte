<script lang="ts">
  import Pokeball from "./Pokeball.svelte";

  let {
    src,
    alt = "",
    class: klass = "",
    style = "",
    lazy = true,
  }: {
    src: string;
    alt?: string;
    class?: string;
    style?: string;
    lazy?: boolean;
  } = $props();

  let loaded = $state(false);
  let failed = $state(false);

  $effect(() => {
    src;
    loaded = false;
    failed = false;
  });
</script>

{#if failed}
  <div class="{klass} flex items-center justify-center" {style}>
    <Pokeball class="h-1/2 w-1/2 opacity-40" />
  </div>
{:else}
  <img
    {src}
    {alt}
    {style}
    loading={lazy ? "lazy" : "eager"}
    onload={() => (loaded = true)}
    onerror={() => {
      loaded = true;
      failed = true;
    }}
    class="{klass} transition-opacity duration-300 {loaded
      ? 'opacity-100'
      : 'opacity-0'}"
  />
{/if}
