<script lang="ts">
  import { isActive } from "$lib/navigation";
  import { popupAlign } from "$lib/popup";

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
    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") open = false;
    }
    function onPointerDown(e: PointerEvent) {
      if (host && !host.contains(e.target as Node)) open = false;
    }
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  });
</script>

<div bind:this={host} class="relative">
  <button
    type="button"
    onclick={() => (open = !open)}
    aria-expanded={open}
    aria-haspopup="menu"
    class="nav-link {groupActive
      ? 'nav-link-active'
      : ''} flex cursor-pointer items-center gap-1 border-0"
  >
    <span>{icon} {label}</span>
    <span class="text-[9px] opacity-70">{open ? "▴" : "▾"}</span>
  </button>
  {#if open}
    <div
      role="menu"
      class="absolute top-full z-50 mt-1 min-w-44 rounded-xl border p-1 shadow-2xl {alignRight
        ? 'right-0'
        : 'left-0'}"
      style="background: var(--card); border-color: var(--border)"
    >
      {#each items as item}
        <a
          href={item.href}
          onclick={() => (open = false)}
          role="menuitem"
          class="nav-link block {isActive(item.href) ? 'nav-link-active' : ''}"
          >{item.icon} {item.label}</a
        >
      {/each}
    </div>
  {/if}
</div>
