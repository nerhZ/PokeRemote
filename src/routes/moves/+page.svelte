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
      const slice = await getMovesSlice(offset, PAGE);
      if (slice.length === 0) {
        // Every fetch in this slice failed (offline/rate-limited): stop paging
        // instead of re-requesting the same empty range forever.
        total = offset;
        if (moves.length === 0) error = "Failed to load moves";
        else stalled = true;
      } else {
        moves = [...moves, ...slice];
        offset += slice.length;
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

  let filtered = $derived.by(() => {
    const q = search.trim().toLowerCase();
    return moves.filter((m) => {
      if (q && !m.name.includes(q)) return false;
      if (typeFilter && m.type !== typeFilter) return false;
      if (classFilter && m.damage_class !== classFilter) return false;
      return true;
    });
  });

  /** Types still present in the loaded set given the current search + class filter. */
  let possibleTypes = $derived.by(() => {
    const q = search.trim().toLowerCase();
    const avail = new Set<string>();
    for (const m of moves) {
      if (q && !m.name.includes(q)) continue;
      if (classFilter && m.damage_class !== classFilter) continue;
      avail.add(m.type);
    }
    return avail;
  });

  /** Damage classes still present in the loaded set given the current search + type filter. */
  let possibleClasses = $derived.by(() => {
    const q = search.trim().toLowerCase();
    const avail = new Set<string>();
    for (const m of moves) {
      if (q && !m.name.includes(q)) continue;
      if (typeFilter && m.type !== typeFilter) continue;
      avail.add(m.damage_class);
    }
    return avail;
  });
</script>

<div class="tool-shell">
  <div class="tool-hero">
    <h1>Move Dex</h1>
    <p>
      Browse all moves with power, accuracy, PP, and effects. {total
        ? `${offset} / ${total} loaded`
        : ""}
    </p>
  </div>

  <div class="mb-4 space-y-3">
    <div class="flex flex-col gap-3 md:flex-row md:items-center">
      <SearchInput
        bind:value={search}
        placeholder="Search moves..."
        class="md:max-w-xs"
      />
      <div class="flex flex-wrap items-center gap-1.5">
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
    <div class="flex flex-wrap items-center gap-1.5">
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
    <p class="mb-3 text-xs" style="color: var(--muted)">
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
    <div class="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {#each filtered as m}
        <div class="panel flex flex-col gap-2 p-4!">
          <div class="flex items-center gap-2">
            <TypeBadge type={m.type} size="xs" focusable={false} />
            <span class="truncate text-sm font-bold">{formatName(m.name)}</span>
            <span
              class="ml-auto shrink-0 text-[10px] font-bold text-white/40 capitalize"
              >{m.damage_class}</span
            >
          </div>
          <div class="text-[10px] font-bold tracking-wide text-white/50">
            Pow {m.power ?? "—"} / Acc {m.accuracy ?? "—"} / PP {m.pp ?? "—"}
          </div>
          {#if m.effect}<p
              class="line-clamp-2 text-xs leading-relaxed text-white/50"
            >
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
        <Skeleton rows={6} tiles class="h-32" />
      {/if}
    </div>
    {#if stalled}
      <div class="mb-4 flex justify-center">
        <button
          onclick={loadMore}
          class="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60 hover:text-white"
          >Couldn't load more moves — retry</button
        >
      </div>
    {:else}
      <InfiniteScroll {loadMore} hasMore={offset < total} />
    {/if}
  {/if}
</div>
