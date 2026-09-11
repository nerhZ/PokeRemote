<script lang="ts">
  import * as stylex from "@stylexjs/stylex";
  import { contrastText } from "$lib/utils";
  import { dynamic } from "../styles/dynamic.stylex";
  import { shared } from "../styles/shared.stylex";
  import { chipStyles } from "./FilterChip.styles";

  let {
    label,
    active,
    onclick,
    color,
    count,
    variant = "accent",
    disabled = false,
  }: {
    label: string;
    active: boolean;
    onclick: () => void;
    color?: string;
    count?: number;
    variant?: "accent" | "color" | "inverted" | "legendary" | "mythical";
    disabled?: boolean;
  } = $props();

  let variantStyle = $derived.by(() => {
    if (disabled) return chipStyles.disabled;
    if (!active) return chipStyles.idle;
    if (variant === "inverted") return chipStyles.inverted;
    if (variant === "color") return chipStyles.colorVariant;
    // Rank-badge chips are fully driven by shared styles.
    if (variant === "legendary" || variant === "mythical") return null;
    return chipStyles.accent;
  });

  function activeStyle() {
    if (!active) return null;
    if (variant === "color" && color)
      return [
        dynamic.backgroundColor(color),
        dynamic.color(contrastText(color)),
      ];
    if (variant === "legendary") return shared.legendaryBadge;
    if (variant === "mythical") return shared.mythicalBadge;
    return null;
  }
</script>

<button
  type="button"
  {onclick}
  aria-pressed={active}
  disabled={disabled && !active}
  {...stylex.attrs(chipStyles.chip, variantStyle, activeStyle())}
  >{label}{#if count != null && count > 0}<span
      {...stylex.attrs(
        chipStyles.countBadge,
        active && chipStyles.countBadgeActive,
      )}>{count}</span
    >{/if}</button
>
