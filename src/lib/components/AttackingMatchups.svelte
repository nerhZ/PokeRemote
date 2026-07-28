<script lang="ts">
  import { getAttackingMatchups } from "$lib/pokemon-types";
  import MatchupRow from "./MatchupRow.svelte";

  let { type }: { type: string } = $props();

  const matchups = $derived(getAttackingMatchups(type));
</script>

{#if matchups.strong.length}
  <MatchupRow label="Strong" types={matchups.strong} color="#4ade80" />
{/if}
{#if matchups.weak.length}
  <MatchupRow label="Weak" types={matchups.weak} color="#ff3e3e" />
{/if}
{#if matchups.immune.length}
  <MatchupRow label="No effect" types={matchups.immune} color="#f7d02c" />
{/if}
