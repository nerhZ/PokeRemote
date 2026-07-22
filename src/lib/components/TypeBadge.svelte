<script lang="ts">
    import { TYPE_COLORS } from "$lib/pokemon-types";
    let { type, size = "sm" }: { type: string; size?: "xs" | "sm" | "md" } = $props();
    const sizes = { xs: "px-2 py-0.5 text-[9px]", sm: "px-2.5 py-1 text-[10px]", md: "px-4 py-1.5 text-xs" };
</script>

<span
    class="rounded-full font-bold uppercase tracking-wide text-white shadow-sm {sizes[size]}"
    style="background-color: {TYPE_COLORS[type] || '#777'}"
>{type}</span>
