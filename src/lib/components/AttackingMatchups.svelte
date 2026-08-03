<script lang="ts">
  import { getAttackingMatchups, MATCHUP_COLORS } from "$lib/pokemon-types";
  import MatchupRow from "./MatchupRow.svelte";

  let { type }: { type: string } = $props();

  const matchups = $derived(getAttackingMatchups(type));
</script>

{#if matchups.strong.length}
  <MatchupRow
    label="Strong"
    types={matchups.strong}
    color={MATCHUP_COLORS.strong}
  />
{/if}
{#if matchups.weak.length}
  <MatchupRow label="Weak" types={matchups.weak} color={MATCHUP_COLORS.weak} />
{/if}
{#if matchups.immune.length}
  <MatchupRow
    label="No effect"
    types={matchups.immune}
    color={MATCHUP_COLORS.immune}
  />
{/if}
