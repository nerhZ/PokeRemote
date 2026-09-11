<script lang="ts">
  import * as stylex from "@stylexjs/stylex";
  import { dynamic } from "../styles/dynamic.stylex";
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
    variant?: "accent" | "color" | "inverted";
    disabled?: boolean;
  } = $props();

  let variantStyle = $derived.by(() => {
    if (disabled) return chipStyles.disabled;
    if (!active) return chipStyles.idle;
    if (variant === "inverted") return chipStyles.inverted;
    if (variant === "color") return chipStyles.colorVariant;
    return chipStyles.accent;
  });
</script>

<button
  type="button"
  {onclick}
  aria-pressed={active}
  disabled={disabled && !active}
  {...stylex.attrs(
    chipStyles.chip,
    variantStyle,
    active && variant === "color" && color
      ? dynamic.backgroundColor(color)
      : null,
  )}
  >{label}{#if count != null && count > 0}<span
      {...stylex.attrs(
        chipStyles.countBadge,
        active && chipStyles.countBadgeActive,
      )}>{count}</span
    >{/if}</button
>
