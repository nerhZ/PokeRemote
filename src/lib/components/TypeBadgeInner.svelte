<script lang="ts">
  import { TYPE_COLORS } from "$lib/pokemon-types";
  import * as stylex from "@stylexjs/stylex";
  import { shared } from "$lib/styles/shared.stylex";
  import { dynamic } from "../styles/dynamic.stylex";
  import { sizes, styles, type BadgeSize } from "./TypeBadgeInner.styles";

  let {
    type,
    size = "sm",
    tabindex = undefined,
  }: {
    type: string;
    size?: BadgeSize;
    /** Makes the badge focusable so the surrounding tooltip opens on focus. */
    tabindex?: number;
  } = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex: tooltip trigger; focus reveals the popup -->
<span
  {tabindex}
  {...stylex.attrs(
    shared.typeBadgeText,
    styles.badge,
    sizes[size],
    dynamic.backgroundColor(TYPE_COLORS[type] || "#777"),
  )}>{type}</span
>
