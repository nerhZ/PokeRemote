<script lang="ts">
  import { getMovesSlice, getMovesTotal, getMoveLearners } from "$lib/api";
  import {
    ALL_TYPES,
    TYPE_COLORS,
    formatName,
    type MoveDetail,
  } from "$lib/pokemon-types";
  import TypeBadge from "$lib/components/TypeBadge.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import SearchInput from "$lib/components/SearchInput.svelte";
  import FilterChip from "$lib/components/FilterChip.svelte";
  import Skeleton from "$lib/components/Skeleton.svelte";
  import InfiniteScroll from "$lib/components/InfiniteScroll.svelte";
  import LearnerList from "$lib/components/LearnerList.svelte";
  import { onMount } from "svelte";
  import * as stylex from "@stylexjs/stylex";
  import { shared } from "$lib/styles/shared.stylex";
  import { styles } from "./styles";

  let moves = $state<MoveDetail[]>([]);
  let loading = $state(true);
  let loadingMore = $state(false);
  let error = $state<string | null>(null);
  let total = $state(0);
  let offset = $state(0);
  const PAGE = 300;

  let search = $state("");
  let typeFilter = $state("");
  let classFilter = $state("");
  let stalled = $state(false);

  const DAMAGE_CLASSES = ["physical", "special", "status"];

  async function loadMore() {
    if (loadingMore) return;
    loadingMore = true;
    stalled = false;
    try {
      const { moves: slice, nextOffset } = await getMovesSlice(offset, PAGE);
      if (slice.length === 0) {
        // Every fetch in this slice failed (offline/rate-limited): stop paging
        // instead of re-requesting the same empty range forever.
        total = offset;
        if (moves.length === 0) error = "Failed to load moves";
        else stalled = true;
      } else {
        moves = [...moves, ...slice];
        offset = nextOffset;
      }
    } catch (e: any) {
      if (moves.length === 0) error = e.message;
      else stalled = true;
    } finally {
      loadingMore = false;
      loading = false;
    }
  }

  onMount(async () => {
    try {
      total = await getMovesTotal();
      await loadMore();
    } catch (e: any) {
      error = e.message;
      loading = false;
    }
  });

  /** Moves matching the search box. Filtering and facet availability both build on this. */
  let searched = $derived.by(() => {
    const q = search.trim().toLowerCase();
    return q ? moves.filter((m) => m.name.includes(q)) : moves;
  });

  let filtered = $derived(
    searched.filter(
      (m) =>
        (!typeFilter || m.type === typeFilter) &&
        (!classFilter || m.damage_class === classFilter),
    ),
  );

  /** Types still present in the loaded set given the current search + class filter. */
  let possibleTypes = $derived.by(() => {
    const avail = new Set<string>();
    for (const m of searched) {
      if (classFilter && m.damage_class !== classFilter) continue;
      avail.add(m.type);
    }
    return avail;
  });

  /** Damage classes still present in the loaded set given the current search + type filter. */
  let possibleClasses = $derived.by(() => {
    const avail = new Set<string>();
    for (const m of searched) {
      if (typeFilter && m.type !== typeFilter) continue;
      avail.add(m.damage_class);
    }
    return avail;
  });
</script>

<div {...stylex.attrs(shared.toolShell)}>
  <div {...stylex.attrs(shared.toolHero)}>
    <h1 {...stylex.attrs(shared.toolHeroTitle)}>Move Dex</h1>
    <p {...stylex.attrs(shared.toolHeroText)}>
      Browse all moves with power, accuracy, PP, and effects. {total
        ? `${moves.length} / ${total} loaded`
        : ""}
    </p>
  </div>

  <div {...stylex.attrs(styles.filterSection)}>
    <div {...stylex.attrs(styles.searchRow)}>
      <SearchInput
        bind:value={search}
        placeholder="Search moves..."
        sx={styles.searchInput}
      />
      <div {...stylex.attrs(styles.chipRow)}>
        <FilterChip
          label="All types"
          active={typeFilter === ""}
          onclick={() => (typeFilter = "")}
        />
        {#each ALL_TYPES as t}
          <FilterChip
            label={t}
            active={typeFilter === t}
            variant="color"
            color={TYPE_COLORS[t]}
            disabled={!loading && typeFilter !== t && !possibleTypes.has(t)}
            onclick={() => (typeFilter = typeFilter === t ? "" : t)}
          />
        {/each}
      </div>
    </div>
    <div {...stylex.attrs(styles.chipRow)}>
      {#each DAMAGE_CLASSES as c}
        <FilterChip
          label={c}
          active={classFilter === c}
          disabled={!loading && classFilter !== c && !possibleClasses.has(c)}
          onclick={() => (classFilter = classFilter === c ? "" : c)}
        />
      {/each}
    </div>
  </div>

  {#if search && moves.length > 0}
    <p {...stylex.attrs(styles.resultNote)}>
      Results only cover the {moves.length} of {total} moves loaded so far (loaded
      alphabetically) — scroll to the bottom to load more.
    </p>
  {/if}

  {#if loading}
    <Skeleton rows={12} />
  {:else if error}
    <EmptyState
      title="Failed to load moves"
      subtitle={error}
      actionLabel="Try again"
      onaction={() => window.location.reload()}
    />
  {:else if filtered.length === 0}
    <EmptyState title="No moves match" subtitle="Try different filters." />
  {:else}
    <div {...stylex.attrs(styles.grid)}>
      {#each filtered as m}
        <div {...stylex.attrs(shared.panel, styles.card)}>
          <div {...stylex.attrs(styles.cardHead)}>
            <TypeBadge type={m.type} size="xs" focusable={false} />
            <span {...stylex.attrs(styles.name)}>{formatName(m.name)}</span>
            <span {...stylex.attrs(styles.damageClass)}>{m.damage_class}</span>
          </div>
          <div {...stylex.attrs(styles.stats)}>
            Pow {m.power ?? "—"} / Acc {m.accuracy ?? "—"} / PP {m.pp ?? "—"}
          </div>
          {#if m.effect}<p {...stylex.attrs(styles.effect)}>
              {m.effect}
            </p>{/if}
          {#if m.learned_by_count != null && m.learned_by_count > 0}
            <LearnerList
              name={m.name}
              count={m.learned_by_count}
              label={(n) => `Learned by ${n}`}
              fetchNames={getMoveLearners}
            />
          {/if}
        </div>
      {/each}
      {#if loadingMore}
        <Skeleton rows={6} tiles sx={styles.skeletonTile} />
      {/if}
    </div>
    {#if stalled}
      <div {...stylex.attrs(styles.retryWrap)}>
        <button onclick={loadMore} {...stylex.attrs(styles.retryButton)}
          >Couldn't load more moves — retry</button
        >
      </div>
    {:else}
      <InfiniteScroll {loadMore} hasMore={offset < total} />
    {/if}
  {/if}
</div>
