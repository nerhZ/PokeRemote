<script lang="ts">
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
</script>

<img
  {src}
  {alt}
  {style}
  loading={lazy ? "lazy" : "eager"}
  onload={() => (loaded = true)}
  onerror={() => (loaded = true)}
  class="{klass} transition-opacity duration-300 {loaded
    ? 'opacity-100'
    : 'opacity-0'}"
/>
