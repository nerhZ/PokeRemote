<script lang="ts">
  import { resolve } from "$app/paths";
  import { formatName } from "$lib/pokemon-types";

  let {
    name,
    count,
    label,
    fetchNames,
  }: {
    name: string;
    count: number;
    /** Button text for the given count, e.g. `(n) => `Learned by ${n}``. */
    label: (count: number) => string;
    fetchNames: (name: string) => Promise<string[]>;
  } = $props();

  let open = $state(false);
  let loading = $state(false);
  let error = $state(false);
  let names = $state<string[]>([]);

  async function toggle() {
    if (open) {
      open = false;
      return;
    }
    open = true;
    if (names.length > 0 || loading) return;
    loading = true;
    error = false;
    try {
      names = await fetchNames(name);
    } catch {
      error = true;
      names = [];
    } finally {
      loading = false;
    }
  }
</script>

<button
  onclick={toggle}
  class="cursor-pointer self-start rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white/60 transition-colors hover:text-white"
  >{label(count)} {open ? "▴" : "▾"}</button
>
{#if open}
  <div
    class="max-h-40 overflow-y-auto rounded-lg border border-white/6 bg-white/2 p-2"
  >
    {#if loading}
      <span class="text-xs text-white/40">Loading…</span>
    {:else if error}
      <span class="text-xs text-white/40">Couldn't load names.</span>
    {:else}
      <div class="grid grid-cols-2 gap-x-3 gap-y-0.5 sm:grid-cols-3">
        {#each names as learner}
          <a
            href={resolve(`/pokemon/${learner}`)}
            class="truncate rounded-md px-1.5 py-0.5 text-sm no-underline transition-colors hover:bg-white/5 hover:text-white"
            style="color: var(--muted)">{formatName(learner)}</a
          >
        {/each}
      </div>
    {/if}
  </div>
{/if}
