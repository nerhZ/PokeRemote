<script lang="ts">
  import { page } from "$app/state";

  let { onclick }: { onclick: () => void } = $props();
</script>

{#if page.url.search}
  <button
    {onclick}
    class="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 hover:text-white"
    >Clear</button
  >
{/if}
