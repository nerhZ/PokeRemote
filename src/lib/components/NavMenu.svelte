<script lang="ts">
  import { isActive } from "$lib/navigation";
  import { onDismiss, popupAlign } from "$lib/popup";
  import * as stylex from "@stylexjs/stylex";
  import { shared } from "$lib/styles/shared.stylex";
  import { styles } from "./NavMenu.styles";

  let {
    label,
    icon,
    items,
  }: {
    label: string;
    icon: string;
    items: readonly { href: string; label: string; icon: string }[];
  } = $props();

  let open = $state(false);
  let alignRight = $state(false);
  let host: HTMLElement | undefined = $state();

  let groupActive = $derived(items.some((i) => isActive(i.href)));

  $effect(() => {
    if (!open || !host) return;
    const rect = host.getBoundingClientRect();
    const panel = host.querySelector('[role="menu"]');
    const width = panel ? panel.getBoundingClientRect().width : 176;
    alignRight = popupAlign(rect.left + rect.width / 2, width) === "right";
  });

  $effect(() => {
    if (!open) return;
    return onDismiss(host, () => (open = false));
  });
</script>

<div bind:this={host} {...stylex.attrs(styles.host)}>
  <button
    type="button"
    onclick={() => (open = !open)}
    aria-expanded={open}
    aria-haspopup="menu"
    {...stylex.attrs(
      shared.navLink,
      groupActive && shared.navLinkActive,
      styles.trigger,
    )}
  >
    <span>{icon} {label}</span>
    <span {...stylex.attrs(styles.caret)}>{open ? "▴" : "▾"}</span>
  </button>
  {#if open}
    <div
      role="menu"
      {...stylex.attrs(
        styles.menu,
        alignRight ? styles.menuRight : styles.menuLeft,
      )}
    >
      {#each items as item}
        <a
          href={item.href}
          onclick={() => (open = false)}
          role="menuitem"
          {...stylex.attrs(
            shared.navLink,
            styles.menuItem,
            isActive(item.href) && shared.navLinkActive,
          )}>{item.icon} {item.label}</a
        >
      {/each}
    </div>
  {/if}
</div>
