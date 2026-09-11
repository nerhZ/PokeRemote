<script lang="ts">
  import * as stylex from "@stylexjs/stylex";
  import type { BoxSx } from "$lib/styles/stylex-types";
  import { onMount } from "svelte";
  import { styles } from "./InfiniteScroll.styles";

  let {
    loadMore,
    hasMore,
    sx,
  }: {
    loadMore: () => void;
    hasMore: boolean;
    sx?: BoxSx;
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
  <div {...stylex.attrs(styles.root, sx)}>
    <div
      bind:this={sentinel}
      {...stylex.attrs(styles.sentinel)}
      aria-hidden="true"
    ></div>
  </div>
{/if}
