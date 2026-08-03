<script lang="ts">
  let {
    rows = 1,
    class: klass = "h-24",
    grid = true,
    cols = "sm:grid-cols-2 lg:grid-cols-3",
  }: {
    rows?: number;
    class?: string;
    grid?: boolean;
    cols?: string;
  } = $props();
</script>

{#if grid}
  <div class="grid grid-cols-1 gap-3 {cols}">
    {#each Array(rows) as _}
      <div class="animate-pulse rounded-2xl bg-white/3 {klass}"></div>
    {/each}
  </div>
{:else}
  <div class="space-y-2">
    {#each Array(rows) as _}
      <div class="animate-pulse rounded-2xl bg-white/3 {klass}"></div>
    {/each}
  </div>
{/if}
