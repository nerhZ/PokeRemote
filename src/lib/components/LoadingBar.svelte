<script lang="ts">
  import { navigating } from "$app/state";

  let visible = $state(false);
  let showTimer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    if (navigating.to !== null) {
      showTimer = setTimeout(() => (visible = true), 120);
      return () => clearTimeout(showTimer);
    }
    visible = false;
  });
</script>

{#if visible}
  <div
    class="absolute top-0 right-0 left-0 z-10 h-0.5 overflow-hidden bg-white/5"
  >
    <div
      class="bg-accent/70 h-full"
      style="width: 33%; animation: nav-loading-bar 1.2s ease-in-out infinite"
    ></div>
  </div>
{/if}
