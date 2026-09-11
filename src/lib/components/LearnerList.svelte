<script lang="ts">
  import { resolve } from "$app/paths";
  import { formatName } from "$lib/pokemon-types";
  import * as stylex from "@stylexjs/stylex";
  import Popover from "./Popover.svelte";
  import { styles } from "./LearnerList.styles";

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

<Popover {open} onClose={() => (open = false)} panelSx={styles.panel}>
  {#snippet trigger()}
    <button onclick={toggle} {...stylex.attrs(styles.trigger)}
      >{label(count)} {open ? "▴" : "▾"}</button
    >
  {/snippet}
  {#snippet panel()}
    {#if loading}
      <span {...stylex.attrs(styles.message)}>Loading…</span>
    {:else if error}
      <span {...stylex.attrs(styles.message)}>Couldn't load names.</span>
    {:else}
      <div {...stylex.attrs(styles.grid)}>
        {#each names as learner}
          <a
            href={resolve(`/pokemon/${learner}`)}
            {...stylex.attrs(styles.item)}>{formatName(learner)}</a
          >
        {/each}
      </div>
    {/if}
  {/snippet}
</Popover>
