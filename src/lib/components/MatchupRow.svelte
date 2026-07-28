<script lang="ts">
  import TypeBadgeInner from "./TypeBadgeInner.svelte";

  let {
    label,
    types,
    color,
  }: { label: string; types: string[]; color: string } = $props();
</script>

<div class="mt-1.5 flex items-center gap-1.5">
  <span class="shrink-0 text-[10px] font-bold" style="color: {color}"
    >{label}</span
  >
  <div class="flex flex-wrap gap-1">
    {#each types as t}
      <TypeBadgeInner type={t} size="xs" />
    {/each}
  </div>
</div>
