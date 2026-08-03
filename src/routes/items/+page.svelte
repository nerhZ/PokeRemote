<script lang="ts">
  import { getItemsList, searchItems } from "$lib/api";
  import { formatName, type ItemSummary } from "$lib/pokemon-types";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
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
    try {
      await load(true);
    } catch (e: any) {
      error = e.message;
    } finally {
      loadingMore = false;
    }
  }

  onMount(async () => {
    try {
      await load(false);
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  $effect(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      searchResults = [];
      searchLoading = false;
      return;
    }
    const gen = ++searchGen;
    searchLoading = true;
    searchItems(q).then((results) => {
      if (gen === searchGen) {
        searchResults = results;
        searchLoading = false;
      }
    });
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
  {:else if error}
    <EmptyState title="Failed to load items" subtitle={error} />
  {:else if search && searchLoading}
    <div class="flex justify-center py-16">
      <LoadingSpinner size="lg" />
    </div>
  {:else if filtered.length === 0}
    <EmptyState title="No items match" subtitle="No items match." />
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
    </div>
    {#if !search}
      {#if loadingMore}
        <div class="pb-4">
          <Skeleton rows={6} />
        </div>
      {/if}
      <InfiniteScroll {loadMore} hasMore={nextOffset < total} />
    {/if}
  {/if}
</div>
