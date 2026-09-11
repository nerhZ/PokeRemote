<script lang="ts">
  import { getItemsList, searchItems } from "$lib/api";
  import { formatName, type ItemSummary } from "$lib/pokemon-types";
  import Pokeball from "$lib/components/Pokeball.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import SearchInput from "$lib/components/SearchInput.svelte";
  import Skeleton from "$lib/components/Skeleton.svelte";
  import InfiniteScroll from "$lib/components/InfiniteScroll.svelte";
  import { onMount } from "svelte";
  import * as stylex from "@stylexjs/stylex";
  import { shared } from "$lib/styles/shared.stylex";
  import { styles } from "./styles";

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

<div {...stylex.attrs(shared.toolShell)}>
  <div {...stylex.attrs(shared.toolHero)}>
    <h1 {...stylex.attrs(shared.toolHeroTitle)}>Item Dex</h1>
    <p {...stylex.attrs(shared.toolHeroText)}>
      Browse items from PokeAPI — sprites, categories, cost, and short effects. {total
        ? `${total} total`
        : ""}
    </p>
  </div>

  <div {...stylex.attrs(styles.searchWrap)}>
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
    <div {...stylex.attrs(styles.loadingWrap)}>
      <Pokeball spinning sx={styles.pokeball} />
    </div>
  {:else if filtered.length === 0}
    <EmptyState
      title="No items match"
      subtitle="Try a different search term."
    />
  {:else}
    <div {...stylex.attrs(styles.grid)}>
      {#each filtered as item}
        <div {...stylex.attrs(shared.panel, styles.card)}>
          {#if item.sprite}
            <img
              src={item.sprite}
              alt={item.name}
              {...stylex.attrs(styles.sprite)}
            />
          {:else}
            <div {...stylex.attrs(styles.spritePlaceholder)}></div>
          {/if}
          <div {...stylex.attrs(styles.body)}>
            <div {...stylex.attrs(styles.name)}>
              {formatName(item.name)}
            </div>
            <div {...stylex.attrs(styles.meta)}>
              {item.category ? formatName(item.category) : "item"} · ₽{item.cost}
            </div>
            {#if item.effect}<p {...stylex.attrs(styles.effect)}>
                {item.effect}
              </p>{/if}
          </div>
        </div>
      {/each}
      {#if !search && loadingMore}
        <Skeleton rows={6} tiles sx={styles.skeletonTile} />
      {/if}
    </div>
    {#if !search}
      {#if stalled}
        <div {...stylex.attrs(styles.retryWrap)}>
          <button onclick={loadMore} {...stylex.attrs(styles.retryButton)}
            >Couldn't load more items - retry</button
          >
        </div>
      {:else}
        <InfiniteScroll {loadMore} hasMore={nextOffset < total} />
      {/if}
    {/if}
  {/if}
</div>
