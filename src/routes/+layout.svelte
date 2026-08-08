<script lang="ts">
  import { page } from "$app/state";
  import { goto, afterNavigate, beforeNavigate } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { onMount } from "svelte";
  import { applyTheme, getTheme, setTheme, type ThemeMode } from "$lib/storage";
  import { isActive, gotoRandomPokemon } from "$lib/navigation";
  import { dismissAppLoader } from "$lib/loader";
  import { collapseStarted, collapseFinished } from "$lib/search-anim";
  import PokemonSearch from "$lib/components/PokemonSearch.svelte";
  import LoadingBar from "$lib/components/LoadingBar.svelte";
  import NavMenu from "$lib/components/NavMenu.svelte";
  import Pokeball from "$lib/components/Pokeball.svelte";
  import SpriteToggle from "$lib/components/SpriteToggle.svelte";
  import "../app.css";

  let { children } = $props();
  let mobileOpen = $state(false);
  let theme = $state<ThemeMode>("dark");
  let showTop = $state(false);
  let searchCollapse = $state<HTMLDivElement | null>(null);

  /** The Pokédex page has its own filter search — hide the global one there. */
  const onHome = $derived(page.url.pathname === resolve("/"));

  /** Mobile search open state. Flips in beforeNavigate so the fly-out starts
      before the route loads. Init value comes from the loaded route. */
  let searchOpen = $state(page.url.pathname !== resolve("/"));
  let prevOpen: boolean | null = null;
  let searchRow = $state<HTMLDivElement | null>(null);
  let searchH = $state(50);

  // The row never unmounts (a nav-torn-down node can't animate), so fly-out
  // is hand-rolled: a frame-count rAF loop for height (stalls pause it
  // instead of time-based animations skipping to the end) + a compositor
  // opacity transition (keeps fading while the main thread is busy). The
  // open height is read from the --search-h CSS var (set once from the real
  // content, so the animation matches even if input sizing changes).
  $effect(() => {
    const outer = searchCollapse;
    if (!outer) return;
    const row: HTMLDivElement = outer;

    const open = searchOpen;
    const openH =
      parseFloat(getComputedStyle(row).getPropertyValue("--search-h")) || 50;
    const prev = prevOpen;
    prevOpen = open;

    // The row must only clip while animating — idle, its overflow must stay
    // visible or the absolute suggestion dropdown (top-full) gets cut off.
    // On desktop the row is display:none (lg:hidden), so skip the animation
    // entirely there (an invisible 1s loop would also block the home page's
    // catalog load via collapseStarted).
    const isMobile = matchMedia("(max-width: 1023px)").matches;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const setEnd = () => {
      row.style.height = open ? `${openH}px` : "0px";
      row.style.overflow = "";
      collapseFinished();
    };

    // First run, no change, desktop, or reduced motion → end state instantly.
    if (prev === null || prev === open || !isMobile || reduced) {
      setEnd();
      return;
    }

    const from = open ? 0 : openH;
    const to = open ? openH : 0;
    row.style.height = `${from}px`;
    row.style.overflow = "hidden";
    if (!open) collapseStarted();

    let f = 0;
    let raf = requestAnimationFrame(tick);
    function tick() {
      f++;
      const t = Math.min(f / 60, 1); // ~1000ms at 60fps
      const eased = 1 - Math.pow(1 - t, 3);
      row.style.height = `${Math.round(from + (to - from) * eased)}px`;
      if (f < 60) raf = requestAnimationFrame(tick);
      else {
        row.style.overflow = "";
        collapseFinished();
      }
    }
    return () => {
      cancelAnimationFrame(raf);
      row.style.overflow = "";
      collapseFinished();
    };
  });

  const groups = [
    {
      label: "Tools",
      icon: "⚒",
      items: [
        { href: "/compare", label: "Compare", icon: "⇄" },
        { href: "/team-builder", label: "Team", icon: "⬡" },
        { href: "/damage-calc", label: "Damage", icon: "⚔" },
        { href: "/rankings", label: "Rankings", icon: "★" },
      ],
    },
    {
      label: "Dexes",
      icon: "◆",
      items: [
        { href: "/items", label: "Items", icon: "◆" },
        { href: "/abilities", label: "Abilities", icon: "✧" },
        { href: "/moves", label: "Moves", icon: "✦" },
        { href: "/type-chart", label: "Type Chart", icon: "▤" },
      ],
    },
  ] as const;

  const primary = [{ href: "/", label: "Pokédex", icon: "◎" }] as const;
  const quiz = { href: "/quiz", label: "Quiz", icon: "❓" } as const;

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    theme = next;
    setTheme(next);
  }

  onMount(() => {
    setTimeout(dismissAppLoader, 300);

    // Measure the row's real open height (input + padding) once, so the
    // animation matches content even if input sizing changes.
    if (searchRow) searchH = Math.max(searchRow.offsetHeight, 40);

    theme = getTheme();
    applyTheme();

    function onScroll() {
      showTop = window.scrollY > 400;
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target as HTMLElement)?.isContentEditable
      )
        return;
      if (e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        // resolve() so this works under a base path (GitHub Pages), where
        // page.url.pathname includes the repo name.
        const onHome = page.url.pathname === resolve("/");
        const el = document.querySelector<HTMLInputElement>(
          onHome ? "main [data-global-search]" : "[data-global-search]",
        );
        el?.focus();
      }
      if (e.key === "r" || e.key === "R") {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          gotoRandomPokemon();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  });

  beforeNavigate(({ from, to }) => {
    // Flip the fly-out before the route loads so it doesn't fight the next
    // page's data loading.
    if (to?.url) {
      const goingHome = to.url.pathname === resolve("/");
      if (goingHome && searchOpen) searchOpen = false;
      else if (!goingHome && !searchOpen) searchOpen = true;
    }

    if (
      from?.route?.id &&
      !from.route.id.startsWith("/pokemon") &&
      to?.route?.id?.startsWith("/pokemon")
    ) {
      localStorage.setItem(
        "previousUrl",
        from.route.id + (from.url?.search ?? ""),
      );
    }
  });

  afterNavigate(({ to }) => {
    if (!to?.url) return;
    const pathname = to.url.pathname;
    if (to.url.search) {
      localStorage.setItem(`pageState:${pathname}`, to.url.search);
    }

    // Bound retained per-path states so they can't accumulate indefinitely.
    const stateKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("pageState:")) stateKeys.push(key);
    }
    if (stateKeys.length > 12) {
      let removed = 0;
      for (const key of stateKeys) {
        if (key === `pageState:${pathname}`) continue;
        localStorage.removeItem(key);
        if (++removed >= stateKeys.length - 12) break;
      }
    }

    if (!to.url.search) {
      const saved = localStorage.getItem(`pageState:${pathname}`);
      if (saved) {
        goto(`${pathname}${saved}`, { replaceState: true });
      }
    }
  });
</script>

<svelte:head>
  <title>PokéRemote - Modern Pokedex</title>
</svelte:head>

<div class="flex min-h-screen flex-col">
  <header
    class="sticky top-0 z-50 border-b py-3 backdrop-blur-md"
    style="background: color-mix(in srgb, var(--bg) 85%, transparent); border-color: var(--border)"
  >
    <nav
      class="mx-auto flex min-h-11 max-w-7xl items-center justify-between gap-3 px-4 md:px-6"
    >
      <a
        href={resolve("/")}
        class="flex items-center gap-2.5 text-xl font-extrabold tracking-tighter no-underline md:text-2xl"
        style="color: var(--text)"
      >
        <Pokeball class="size-7" />
        PokéRemote
      </a>

      <div
        class="desktop-search hidden min-w-0 flex-1 justify-center px-2 lg:flex"
        class:closed={onHome}
        inert={onHome}
      >
        <div class="w-full max-w-md">
          <PokemonSearch
            navigate
            globalSearch
            placeholder="Search any Pokémon..."
          />
        </div>
      </div>

      <div class="hidden flex-wrap items-center gap-1 lg:flex">
        {#each primary as link}
          <a
            href={resolve(link.href)}
            class="nav-link {isActive(link.href) ? 'nav-link-active' : ''}"
            >{link.icon} {link.label}</a
          >
        {/each}
        {#each groups as group}
          <NavMenu
            label={group.label}
            icon={group.icon}
            items={group.items.map((i) => ({
              href: resolve(i.href),
              label: i.label,
              icon: i.icon,
            }))}
          />
        {/each}
        <a
          href={resolve(quiz.href)}
          class="nav-link {isActive(quiz.href) ? 'nav-link-active' : ''}"
          >{quiz.icon} {quiz.label}</a
        >
        <SpriteToggle />
        <button
          onclick={toggleTheme}
          class="nav-link cursor-pointer border-0"
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>
        <a
          href="https://github.com/nerhZ/PokeRemote"
          target="_blank"
          rel="noopener noreferrer"
          class="nav-link border-0 focus:outline-none"
          aria-label="GitHub"
          title="GitHub"
        >
          <svg viewBox="0 0 24 24" class="size-5 fill-current">
            <path
              d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
            />
          </svg>
        </a>
      </div>

      <div class="flex items-center gap-2 lg:hidden">
        <button
          onclick={toggleTheme}
          class="nav-link cursor-pointer border-0"
          aria-label="Toggle theme">{theme === "dark" ? "☀" : "☾"}</button
        >
        <a
          href="https://github.com/nerhZ/PokeRemote"
          target="_blank"
          rel="noopener noreferrer"
          class="nav-link border-0 focus:outline-none"
          aria-label="GitHub"
        >
          <svg viewBox="0 0 24 24" class="size-5 fill-current">
            <path
              d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
            />
          </svg>
        </a>
        <button
          onclick={() => (mobileOpen = !mobileOpen)}
          class="nav-link cursor-pointer border-0"
          aria-label="Menu">☰</button
        >
      </div>
    </nav>

    <div
      class="mobile-search lg:hidden"
      class:closed={!searchOpen}
      inert={!searchOpen}
      style="--search-h: {searchH}px"
      bind:this={searchCollapse}
    >
      <div bind:this={searchRow} class="px-4 pt-2 md:px-6">
        <PokemonSearch
          navigate
          globalSearch
          placeholder="Search any Pokémon..."
        />
      </div>
    </div>

    {#if mobileOpen}
      <div
        class="flex flex-col gap-1 border-t px-4 py-3 lg:hidden"
        style="border-color: var(--border); background: var(--bg)"
      >
        {#each primary as link}
          <a
            href={resolve(link.href)}
            onclick={() => (mobileOpen = false)}
            class="nav-link {isActive(link.href)
              ? 'nav-link-active'
              : ''} block">{link.icon} {link.label}</a
          >
        {/each}
        {#each groups as group}
          <p
            class="px-3 pt-2 text-[10px] font-bold tracking-wider uppercase"
            style="color: var(--muted)"
          >
            {group.icon}
            {group.label}
          </p>
          {#each group.items as item}
            <a
              href={resolve(item.href)}
              onclick={() => (mobileOpen = false)}
              class="nav-link {isActive(item.href)
                ? 'nav-link-active'
                : ''} block pl-6">{item.icon} {item.label}</a
            >
          {/each}
        {/each}
        <a
          href={resolve(quiz.href)}
          onclick={() => (mobileOpen = false)}
          class="nav-link {isActive(quiz.href)
            ? 'nav-link-active'
            : ''} mt-2 block">{quiz.icon} {quiz.label}</a
        >
        <SpriteToggle mobile onclick={() => (mobileOpen = false)} />
        <p class="px-3 pt-2 text-[10px]" style="color: var(--muted)">
          Shortcuts: <kbd>/</kbd> search · <kbd>R</kbd> random
        </p>
      </div>
    {/if}
  </header>

  <main class="relative flex-1">
    <LoadingBar />
    {@render children()}
  </main>

  {#if showTop}
    <button
      onclick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      class="fixed right-5 bottom-5 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border shadow-lg transition-transform hover:-translate-y-0.5"
      style="border-color: var(--border); background: color-mix(in srgb, var(--card) 90%, transparent); color: var(--text)"
      aria-label="Back to top"
      title="Back to top"
    >
      <svg
        viewBox="0 0 24 24"
        class="size-5"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  {/if}

  <footer
    class="mx-auto max-w-7xl px-6 py-8 text-center text-xs"
    style="color: var(--muted)"
  >
    <p>
      Credit to PokeAPI · Pokémon and Pokémon character names are trademarks of
      Nintendo · Press <kbd>/</kbd> search · <kbd>R</kbd> random
    </p>
  </footer>
</div>

<style>
  /* Always mounted (nav teardown kills anything else); desktop fades via CSS,
     mobile height via the rAF loop + opacity via this compositor transition. */
  .desktop-search {
    opacity: 1;
    transform: translateX(0);
    transition:
      opacity 350ms ease,
      transform 350ms ease;
  }
  .desktop-search.closed {
    opacity: 0;
    transform: translateX(-32px);
  }

  .mobile-search {
    --search-h: 50px;
    height: var(--search-h);
    will-change: opacity;
    transition: opacity 1000ms ease;
  }
  /* overflow hidden only when closed: while open, the row must not clip the
     absolute suggestion dropdown below the input. During animations the
     effect sets overflow inline and clears it when done. */
  .mobile-search.closed {
    height: 0;
    opacity: 0;
    overflow: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    .desktop-search,
    .mobile-search {
      transition: none;
    }
  }
</style>
