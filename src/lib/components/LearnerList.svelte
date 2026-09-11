<script lang="ts">
  import { resolve } from "$app/paths";
  import type { Learner } from "$lib/api";
  import { formatId, formatName, spriteUrl } from "$lib/pokemon-types";
  import * as stylex from "@stylexjs/stylex";
  import PokemonImage from "./PokemonImage.svelte";
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
    fetchNames: (name: string) => Promise<Learner[]>;
  } = $props();

  let open = $state(false);
  let loading = $state(false);
  let error = $state(false);
  let learners = $state<Learner[]>([]);

  async function toggle() {
    if (open) {
      open = false;
      return;
    }
    open = true;
    if (learners.length > 0 || loading) return;
    loading = true;
    error = false;
    try {
      learners = await fetchNames(name);
    } catch {
      error = true;
      learners = [];
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
        {#each learners as learner}
          <a
            href={resolve(`/pokemon/${learner.name}`)}
            {...stylex.attrs(styles.item)}
          >
            <PokemonImage
              src={spriteUrl(learner.id)}
              id={learner.id}
              alt=""
              sx={styles.sprite}
            />
            <span {...stylex.attrs(styles.name)}
              >{formatName(learner.name)}</span
            >
            <span {...stylex.attrs(styles.id)}>{formatId(learner.id)}</span>
          </a>
        {/each}
      </div>
    {/if}
  {/snippet}
</Popover>
