<script lang="ts">
  import * as stylex from "@stylexjs/stylex";
  import { dynamic } from "../styles/dynamic.stylex";
  import { styles } from "./TabBar.styles";

  interface Tab {
    id: string;
    label: string;
  }

  let {
    tabs,
    active,
    color = "#777",
    onchange,
  }: {
    tabs: Tab[];
    active: string;
    color?: string;
    onchange: (id: string) => void;
  } = $props();
</script>

<div role="tablist" {...stylex.attrs(styles.root)}>
  {#each tabs as t, i}
    <button
      role="tab"
      aria-selected={active === t.id}
      onclick={() => onchange(t.id)}
      onkeydown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          const dir = e.key === "ArrowRight" ? 1 : -1;
          onchange(tabs[(i + dir + tabs.length) % tabs.length].id);
        }
      }}
      {...stylex.attrs(
        styles.tab,
        active === t.id ? styles.tabActive : styles.tabIdle,
        active === t.id && dynamic.backgroundColor(`${color}33`),
      )}>{t.label}</button
    >
  {/each}
</div>
