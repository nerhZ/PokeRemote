<script lang="ts">
  import Pokeball from "./Pokeball.svelte";

  let {
    done,
    total,
    noun = "",
    children,
  }: {
    done: number;
    total: number;
    /** What is being loaded, appended to "Loading x / y" (e.g. "species"). */
    noun?: string;
    /** Shown instead of the progress bar while no totals are known yet. */
    children?: import("svelte").Snippet;
  } = $props();
</script>

<div class="flex flex-col items-center justify-center py-20">
  <Pokeball class="mb-8 h-24 w-24" spinning />
  {#if total > 0}
    <p class="text-sm font-semibold" style="color: var(--text)">
      Loading {done} / {total}{noun ? ` ${noun}` : ""}...
    </p>
    <div class="mt-4 h-1.5 w-64 overflow-hidden rounded-full bg-white/6">
      <div
        class="bg-accent h-full rounded-full transition-all duration-300"
        style="width: {(done / (total || 1)) * 100}%"
      ></div>
    </div>
  {:else if children}
    {@render children()}
  {/if}
</div>
