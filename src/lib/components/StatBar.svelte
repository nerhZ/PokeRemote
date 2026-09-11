<script lang="ts">
  import * as stylex from "@stylexjs/stylex";
  import { dynamic } from "../styles/dynamic.stylex";
  import {
    bars,
    labels,
    rows,
    styles,
    values,
    type StatBarSize,
  } from "./StatBar.styles";

  let {
    label,
    value,
    color = "#777",
    max = 255,
    size = "md",
  }: {
    label: string;
    value: number;
    color?: string;
    max?: number;
    size?: StatBarSize;
  } = $props();

  const solid = $derived(size === "sm");
</script>

<div {...stylex.attrs(styles.row, rows[size])}>
  <span {...stylex.attrs(styles.label, labels[size])}>{label}</span>
  <span {...stylex.attrs(styles.value, values[size], dynamic.color(color))}
    >{value}</span
  >
  <div {...stylex.attrs(styles.bar, bars[size])}>
    <div
      {...stylex.attrs(
        styles.fill,
        dynamic.width(`${(value / max) * 100}%`),
        dynamic.background(
          solid ? color : `linear-gradient(90deg, ${color}, ${color}80)`,
        ),
      )}
    ></div>
  </div>
</div>
