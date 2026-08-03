<script lang="ts">
  import { onMount } from "svelte";

  let {
    loadMore,
    hasMore,
    class: klass = "",
  }: {
    loadMore: () => void;
    hasMore: boolean;
    class?: string;
  } = $props();

  let sentinel = $state<HTMLElement | undefined>();
  let observer: IntersectionObserver | undefined;
  let loadRef: (() => void) | null = null;

  $effect(() => {
    loadRef = loadMore;
  });

  onMount(() => {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadRef?.();
      },
      { rootMargin: "600px" },
    );
    return () => observer?.disconnect();
  });

  $effect(() => {
    const el = sentinel;
    if (el) {
      observer?.observe(el);
      return () => observer?.unobserve(el);
    }
  });
</script>

{#if hasMore}
  <div class="flex justify-center {klass}">
    <div bind:this={sentinel} class="h-px" aria-hidden="true"></div>
  </div>
{/if}
