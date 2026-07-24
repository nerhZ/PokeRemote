<script lang="ts">
  import { getItemsList, searchItems } from "$lib/api";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import { onMount } from "svelte";

  let items = $state<any[]>([]);
  let loading = $state(true);
  let loadingMore = $state(false);
  let error = $state<string | null>(null);
  let nextOffset = $state(0);
  let total = $state(0);
  let scrollFired = false;
  let search = $state("");
  let searchResults = $state<any[]>([]);
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

  onMount(() => {
    (async () => {
      try {
        await load(false);
      } catch (e: any) {
        error = e.message;
      } finally {
        loading = false;
      }
    })();

    function onScroll() {
      if (loading || loadingMore || !!search || nextOffset >= total) return;
      const bottom = window.innerHeight + window.scrollY;
      const docH = document.documentElement.scrollHeight;
      if (docH - bottom < 600) {
        if (scrollFired) return;
        scrollFired = true;
        loadMore().finally(() => {
          scrollFired = false;
        });
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
    <input
      type="search"
      bind:value={search}
      placeholder="Search all items..."
      class="focus:border-accent/50 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/30 outline-none"
    />
  </div>

  {#if loading}
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {#each Array(12) as _}<div
          class="h-24 animate-pulse rounded-2xl bg-white/3"
        ></div>{/each}
    </div>
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
            <div class="truncate text-sm font-bold capitalize">
              {item.name.replace(/-/g, " ")}
            </div>
            <div class="mt-0.5 text-[10px] text-white/40 capitalize">
              {item.category?.replace(/-/g, " ") ?? "item"} · ₽{item.cost}
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
        <div class="grid grid-cols-1 gap-3 pb-4 sm:grid-cols-2 lg:grid-cols-3">
          {#each Array(6) as _}<div
              class="h-24 animate-pulse rounded-2xl bg-white/3"
            ></div>{/each}
        </div>
      {/if}
      {#if nextOffset < total}
        <div class="flex justify-center pb-12">
          {#if loadingMore}
            <LoadingSpinner size="md" />
          {/if}
        </div>
      {/if}
    {/if}
  {/if}
</div>
