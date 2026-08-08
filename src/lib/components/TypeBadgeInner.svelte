<script lang="ts">
  import { TYPE_COLORS } from "$lib/pokemon-types";

  let {
    type,
    size = "sm",
    tabindex = undefined,
  }: {
    type: string;
    size?: "xs" | "sm" | "md";
    /** Makes the badge focusable so the surrounding tooltip opens on focus. */
    tabindex?: number;
  } = $props();

  const sizes = {
    xs: "px-2 py-0.5 text-[9px]",
    sm: "px-2.5 py-1 text-[10px]",
    md: "px-4 py-1.5 text-xs",
  };
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex: tooltip trigger; focus reveals the popup -->
<span
  {tabindex}
  class="type-badge-text rounded-full font-bold tracking-wide text-white uppercase shadow-sm {sizes[
    size
  ]}"
  style="background-color: {TYPE_COLORS[type] || '#777'}">{type}</span
>
