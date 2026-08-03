<script lang="ts">
  import AttackingMatchups from "./AttackingMatchups.svelte";

  let { type }: { type: string } = $props();
</script>

<div class="mb-1 block font-semibold capitalize" style="color: var(--text)">
  {type}
</div>
<AttackingMatchups {type} />
