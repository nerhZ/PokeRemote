<script lang="ts">
  import { type TypeMatchup } from "$lib/pokemon-types";
  import { TYPE_COLORS } from "$lib/pokemon-types";
  import TypeBadge from "$lib/components/TypeBadge.svelte";

  let { effectiveness }: { effectiveness: TypeMatchup } = $props();

  let rows = $derived.by(() => {
    const r: { label: string; mult: string; types: string[]; color: string }[] =
      [];
    if (effectiveness.four_x_weak.length)
      r.push({
        label: "Strong",
        mult: "4×",
        types: effectiveness.four_x_weak,
        color: "#4ade80",
      });
    if (effectiveness.two_x_weak.length)
      r.push({
        label: "Strong",
        mult: "2×",
        types: effectiveness.two_x_weak,
        color: "#4ade80",
      });
    if (effectiveness.half_resist.length)
      r.push({
        label: "Weak",
        mult: "½×",
        types: effectiveness.half_resist,
        color: "#ff3e3e",
      });
    if (effectiveness.quarter_resist.length)
      r.push({
        label: "Weak",
        mult: "¼×",
        types: effectiveness.quarter_resist,
        color: "#ff3e3e",
      });
    if (effectiveness.immune.length)
      r.push({
        label: "No effect",
        mult: "0×",
        types: effectiveness.immune,
        color: "#f7d02c",
      });
    return r;
  });
</script>

{#if rows.length === 0}
  <p class="text-sm text-white/40">No special matchups.</p>
{:else}
  <div class="space-y-4">
    {#each rows as row}
      <div>
        <div class="mb-2 flex items-center gap-2">
          <span class="text-sm font-semibold" style="color: {row.color}"
            >{row.mult}</span
          >
          <span class="text-xs text-white/40">{row.label}</span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          {#each row.types as t}<TypeBadge type={t} size="sm" />{/each}
        </div>
      </div>
    {/each}
  </div>
{/if}
