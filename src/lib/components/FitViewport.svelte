<script lang="ts">
  import { onMount, untrack } from "svelte";
  import type { Snippet } from "svelte";

  const NO_DEPS: unknown[] = [];

  let {
    class: klass = "",
    deps = NO_DEPS,
    onMeasure = () => {},
    onOverflow = () => {},
    children,
  }: {
    class?: string;
    /** Reactive values that trigger a re-measure when they change (pass a
        `$derived` array so its identity tracks the values, not every render). */
    deps?: unknown[];
    /** Called with the viewport height available (navbar + footer excluded)
        so the page can size its own elements to fill it. */
    onMeasure?: (pageH: number) => void;
    /** Called with the measured document overflow (px) after layout, so the
        page can shrink its sized elements to fit exactly. */
    onOverflow?: (overflow: number) => void;
    children: Snippet;
  } = $props();

  let pageH = $state(0);
  let rafId = 0;
  let destroyed = false;

  function measure() {
    // fonts.ready can resolve after unmount — a stale measure must not
    // schedule another overflow check.
    if (destroyed) return;
    const header =
      document.querySelector("header")?.getBoundingClientRect().height ?? 0;
    const footer =
      document.querySelector("footer")?.getBoundingClientRect().height ?? 0;
    pageH = window.innerHeight - header - footer;
    onMeasure(pageH);
    // Only the latest layout's overflow check may run — stale checks from a
    // previous size would shrink the newly-fitted layout.
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const overflow =
        document.documentElement.scrollHeight - window.innerHeight;
      if (overflow > 1) onOverflow(Math.ceil(overflow));
    });
  }

  onMount(() => {
    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener("resize", measure);
    return () => {
      destroyed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", measure);
    };
  });

  // Re-measure when the page's content changes. Run untracked so the
  // onMeasure/onOverflow callbacks (recreated each parent render) don't
  // become effect dependencies and loop forever.
  $effect(() => {
    for (const d of deps) void d;
    untrack(measure);
  });
</script>

<div class={klass} style="min-height: {pageH}px">
  {@render children()}
</div>
