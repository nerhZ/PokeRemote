<script lang="ts">
    import { getItemsList } from "$lib/api";
    import EmptyState from "$lib/components/EmptyState.svelte";
    import { capitalize } from "$lib/pokemon-types";
    import { onMount } from "svelte";

    let items = $state<any[]>([]);
    let loading = $state(true);
    let loadingMore = $state(false);
    let error = $state<string | null>(null);
    let nextOffset = $state(0);
    let total = $state(0);
    let search = $state("");
    let sentinel = $state<HTMLDivElement | null>(null);

    async function load(append = false) {
        const data = await getItemsList({ limit: 40, offset: append ? nextOffset : 0 });
        items = append ? [...items, ...data.results] : data.results;
        nextOffset = data.next_offset;
        total = data.count;
    }

    $effect(() => {
        const el = sentinel;
        if (!el || !!search) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) loadMore();
        }, { rootMargin: "200px" });
        observer.observe(el);
        return () => observer.disconnect();
    });

    onMount(async () => {
        try {
            await load(false);
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    });

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

    let filtered = $derived(
        search
            ? items.filter((i) => i.name.includes(search.toLowerCase()) || (i.effect || "").toLowerCase().includes(search.toLowerCase()))
            : items
    );
</script>

<div class="tool-shell">
    <div class="tool-hero">
        <h1>Item Dex</h1>
        <p>Browse items from PokeAPI — sprites, categories, cost, and short effects. {total ? `${total} total` : ""}</p>
    </div>

    <div class="mb-6 max-w-md">
        <input type="search" bind:value={search} placeholder="Filter loaded items..." class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-accent/50 placeholder-white/30" />
    </div>

    {#if loading}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {#each Array(12) as _}<div class="h-24 rounded-2xl bg-white/[0.03] animate-pulse"></div>{/each}
        </div>
    {:else if error}
        <EmptyState title="Failed to load items" subtitle={error} />
    {:else if filtered.length === 0}
        <EmptyState title="No items match" subtitle="Try another search or load more." />
    {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {#each filtered as item}
                <div class="panel !p-4 flex gap-3 items-start">
                    {#if item.sprite}
                        <img src={item.sprite} alt={item.name} class="w-10 h-10 object-contain flex-shrink-0 image-pixelated" style="image-rendering: pixelated" />
                    {:else}
                        <div class="w-10 h-10 rounded-lg bg-white/5 flex-shrink-0"></div>
                    {/if}
                    <div class="min-w-0">
                        <div class="text-sm font-bold capitalize truncate">{item.name.replace(/-/g, " ")}</div>
                        <div class="text-[10px] text-white/40 capitalize mt-0.5">{item.category?.replace(/-/g, " ") ?? "item"} · ₽{item.cost}</div>
                        {#if item.effect}<p class="text-xs text-white/50 mt-1.5 leading-relaxed line-clamp-3">{item.effect}</p>{/if}
                    </div>
                </div>
            {/each}
        </div>
        {#if nextOffset < total && !search}
            <div bind:this={sentinel} class="flex justify-center pb-12">
                {#if loadingMore}
                    <div class="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                {/if}
            </div>
        {/if}
    {/if}
</div>
