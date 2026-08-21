<script lang="ts">
  import { getItemsList, searchItems } from "$lib/api";
  import { formatName, type ItemSummary } from "$lib/pokemon-types";
  import Pokeball from "$lib/components/Pokeball.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import SearchInput from "$lib/components/SearchInput.svelte";
  import Skeleton from "$lib/components/Skeleton.svelte";
  import InfiniteScroll from "$lib/components/InfiniteScroll.svelte";
  import { onMount } from "svelte";

  let items = $state<ItemSummary[]>([]);
  let loading = $state(true);
  let loadingMore = $state(false);
  let error = $state<string | null>(null);
  let nextOffset = $state(0);
  let total = $state(0);
  let search = $state("");
  let searchResults = $state<ItemSummary[]>([]);
  let searchLoading = $state(false);
  let searchGen = 0;
  let stalled = $state(false);

  async function load(append = false) {
    const data = await getItemsList({
      limit: 40,
      offset: append ? nextOffset : 0,
    });
    items = append ? [...items, ...data.results] : data.results;
    nextOffset = data.next_offset;
    total = data.count;
  }

  async function loadMore() {
    if (loadingMore) return;
    loadingMore = true;
    stalled = false;
    try {
      await load(true);
    } catch {
      // Keep the already-loaded grid; offer an inline retry below.
      stalled = true;
    } finally {
      loadingMore = false;
    }
  }

  onMount(async () => {
    await retryInitial();
  });

  async function retryInitial() {
    loading = true;
    error = null;
    try {
      await load(false);
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      searchResults = [];
      searchLoading = false;
      return;
    }
    const gen = ++searchGen;
    // Debounce: each keystroke would otherwise trigger a network search
    // (name-list fetch + up to 30 item detail fetches).
    const timer = setTimeout(async () => {
      searchLoading = true;
      try {
        const results = await searchItems(q);
        if (gen === searchGen) {
          searchResults = results;
          searchLoading = false;
        }
      } catch {
        if (gen === searchGen) {
          searchResults = [];
          searchLoading = false;
        }
      }
    }, 200);
    return () => clearTimeout(timer);
  });

  let filtered = $derived(search ? searchResults : items);
</script>

<div class="tool-shell">
  <div class="tool-hero">
    <h1>Item Dex</h1>
    <p>
      Browse items from PokeAPI — sprites, categories, cost, and short effects. {total
        ? `${total} total`
        : ""}
    </p>
  </div>

  <div class="mb-6 max-w-md">
    <SearchInput bind:value={search} placeholder="Search all items..." />
  </div>

  {#if loading}
    <Skeleton rows={12} />
  {:else if error && items.length === 0}
    <EmptyState
      title="Failed to load items"
      subtitle={error}
      actionLabel="Try again"
      onaction={retryInitial}
    />
  {:else if search && searchLoading}
    <div class="flex justify-center py-16">
      <Pokeball spinning class="h-16 w-16" />
    </div>
  {:else if filtered.length === 0}
    <EmptyState
      title="No items match"
      subtitle="Try a different search term."
    />
  {:else}
    <div class="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {#each filtered as item}
        <div class="panel flex items-start gap-3 p-4!">
          {#if item.sprite}
            <img
              src={item.sprite}
              alt={item.name}
              class="h-10 w-10 shrink-0 object-contain"
              style="image-rendering: pixelated"
            />
          {:else}
            <div class="h-10 w-10 shrink-0 rounded-lg bg-white/5"></div>
          {/if}
          <div class="min-w-0">
            <div class="truncate text-sm font-bold">
              {formatName(item.name)}
            </div>
            <div class="mt-0.5 text-[10px] text-white/40 capitalize">
              {item.category ? formatName(item.category) : "item"} · ₽{item.cost}
            </div>
            {#if item.effect}<p
                class="mt-1.5 line-clamp-3 text-xs leading-relaxed text-white/50"
              >
                {item.effect}
              </p>{/if}
          </div>
        </div>
      {/each}
      {#if !search && loadingMore}
        <Skeleton rows={6} tiles class="h-28" />
      {/if}
    </div>
    {#if !search}
      {#if stalled}
        <div class="mb-4 flex justify-center">
          <button
            onclick={loadMore}
            class="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60 hover:text-white"
            >Couldn't load more items - retry</button
          >
        </div>
      {:else}
        <InfiniteScroll {loadMore} hasMore={nextOffset < total} />
      {/if}
    {/if}
  {/if}
</div>
