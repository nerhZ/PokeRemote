<script lang="ts">
  import { EV_STATS, evTotal, type EvSpread } from "$lib/storage";
  import { clamp } from "$lib/utils";
  import * as stylex from "@stylexjs/stylex";
  import { dynamic } from "../styles/dynamic.stylex";
  import { styles } from "./EVInput.styles";

  let {
    evs,
    oninput,
    onIvInput,
    onIvChange = () => {},
    iv,
    stats = EV_STATS,
    label = "EVs",
    warning = "",
    cols = 6,
  }: {
    evs: EvSpread;
    oninput: (key: keyof EvSpread, value: number) => void;
    onIvInput?: (value: number) => void;
    onIvChange?: () => void;
    iv?: number;
    stats?: { key: keyof EvSpread; label: string }[];
    label?: string;
    warning?: string;
    cols?: 1 | 2 | 3 | 4 | 5 | 6;
  } = $props();

  function clampIv(raw: string, fallback: number): number {
    const v = parseInt(raw, 10);
    return Number.isNaN(v) ? fallback : clamp(v, 0, 31);
  }
</script>

<div {...stylex.attrs(styles.root)}>
  <div {...stylex.attrs(styles.header)}>
    <span {...stylex.attrs(styles.label)}>{label} {evTotal(evs)}/510</span>
    {#if iv != null}
      <span {...stylex.attrs(styles.ivRow)}>
        IV
        <input
          type="number"
          min="0"
          max="31"
          value={iv}
          oninput={(e) =>
            onIvInput?.(clampIv((e.target as HTMLInputElement).value, iv))}
          onchange={onIvChange}
          aria-label={`${label} IV`}
          {...stylex.attrs(styles.ivInput)}
        />
      </span>
    {/if}
    {#if warning}
      <span {...stylex.attrs(styles.warning)}>{warning}</span>
    {/if}
  </div>
  <div
    {...stylex.attrs(
      styles.grid,
      dynamic.gridTemplateColumns(`repeat(${cols}, minmax(0, 1fr))`),
    )}
  >
    {#each stats as stat}
      <label {...stylex.attrs(styles.stat)}>
        <span {...stylex.attrs(styles.statLabel)}>{stat.label}</span>
        <input
          type="number"
          min="0"
          max="252"
          value={evs[stat.key] || 0}
          oninput={(e) =>
            oninput(
              stat.key,
              parseInt((e.target as HTMLInputElement).value) || 0,
            )}
          aria-label={`${label} ${stat.label} EVs`}
          {...stylex.attrs(styles.statInput)}
        />
      </label>
    {/each}
  </div>
</div>
