<script lang="ts">
  let { size = "md" }: { size?: "sm" | "md" | "lg" } = $props();
  const sizes = { sm: "h-5 w-5", md: "h-6 w-6", lg: "h-8 w-8" };
</script>

<div
  class="{sizes[
    size
  ]} animate-spin rounded-full border-2 border-white/20 border-t-white"
></div>
