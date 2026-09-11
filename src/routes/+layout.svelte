<script lang="ts">
  import { page } from "$app/state";
  import { goto, afterNavigate, beforeNavigate } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { onMount } from "svelte";
  import { applyTheme, getTheme, setTheme, type ThemeMode } from "$lib/storage";
  import { isActive, gotoRandomPokemon } from "$lib/navigation";
  import { dismissAppLoader } from "$lib/loader";
  import { collapseStarted, collapseFinished } from "$lib/search-anim";
  import { onDismiss } from "$lib/popup";
  import PokemonSearch from "$lib/components/PokemonSearch.svelte";
  import LoadingBar from "$lib/components/LoadingBar.svelte";
  import NavMenu from "$lib/components/NavMenu.svelte";
  import Pokeball from "$lib/components/Pokeball.svelte";
  import SpriteToggle from "$lib/components/SpriteToggle.svelte";
  import * as stylex from "@stylexjs/stylex";
  import { shared } from "$lib/styles/shared.stylex";
  import { dynamic } from "../lib/styles/dynamic.stylex";
  import { styles } from "./layout.styles";
  import "../styles.css";

  if (import.meta.env.DEV) {
    $effect(() => {
      void import("virtual:stylex:runtime");
    });
  }

  let { children } = $props();
  let mobileOpen = $state(false);
  let theme = $state<ThemeMode>("dark");
  let showTop = $state(false);
  let searchCollapse = $state<HTMLDivElement | null>(null);
  let mobileMenu = $state<HTMLElement | null>(null);
  let menuButton = $state<HTMLButtonElement | null>(null);

  // Outside-click/Escape closes the fly-out menu. The hamburger lives outside
  // the panel, so it's excluded here - its own click handler does the toggle
  // (a plain dismissal would close on pointerdown and the click would reopen).
  $effect(() => {
    if (!mobileOpen || !mobileMenu) return;
    return onDismiss(mobileMenu, () => (mobileOpen = false), {
      except: (target) =>
        menuButton != null &&
        target instanceof Node &&
        menuButton.contains(target),
    });
  });

  /** The Pokédex page has its own filter search, so hide the global one there. */
  const onHome = $derived(page.url.pathname === resolve("/"));

  /** Mobile search open state. Flips in beforeNavigate so the fly-out starts
      before the route loads. Init value comes from the loaded route. */
  let searchOpen = $state(page.url.pathname !== resolve("/"));
  let prevOpen: boolean | null = null;
  let searchRow = $state<HTMLDivElement | null>(null);
  let searchH = $state(50);

  // Track the search row's real open height (input + padding). A one-shot
  // mount measure goes stale: the UI webfont swaps in after load (and
  // document.fonts.ready can resolve before it does), leaving the open row
  // shorter than its content so the panel rendered below paints over the
  // input's bottom edge. Observe the row instead and keep both the CSS var
  // and an open row's inline height current as its size changes.
  $effect(() => {
    const row = searchRow;
    const outer = searchCollapse;
    if (!row || !outer) return;
    const applyHeight = () => {
      searchH = Math.max(Math.ceil(row.getBoundingClientRect().height), 40);
      if (searchOpen) outer.style.height = `${searchH}px`;
    };
    applyHeight();
    const observer = new ResizeObserver(applyHeight);
    observer.observe(row);
    return () => observer.disconnect();
  });

  // The row never unmounts (a nav-torn-down node can't animate), so fly-out
  // is hand-rolled: a frame-count rAF loop for height (stalls pause it
  // instead of time-based animations skipping to the end) + a compositor
  // opacity transition (keeps fading while the main thread is busy). The
  // open height comes from the --search-h CSS var, which the ResizeObserver
  // above keeps matched to the real content.
  $effect(() => {
    const outer = searchCollapse;
    if (!outer) return;
    const row: HTMLDivElement = outer;

    const open = searchOpen;
    const openH =
      parseFloat(getComputedStyle(row).getPropertyValue("--search-h")) || 50;
    const prev = prevOpen;
    prevOpen = open;

    // The row must only clip while animating. Idle, its overflow must stay
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
  {#if import.meta.env.DEV}
    <link rel="stylesheet" href="/virtual:stylex.css" />
  {/if}
</svelte:head>

<div {...stylex.attrs(styles.shell)}>
  {#snippet githubLink(showTitle: boolean)}
    <a
      href="https://github.com/nerhZ/PokeRemote"
      target="_blank"
      rel="noopener noreferrer"
      {...stylex.attrs(shared.navLink, styles.iconLink)}
      aria-label="GitHub"
      title={showTitle ? "GitHub" : undefined}
    >
      <svg viewBox="0 0 24 24" {...stylex.attrs(styles.icon)}>
        <path
          d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
        />
      </svg>
    </a>
  {/snippet}

  {#snippet themeToggle(showTitle: boolean)}
    <button
      onclick={toggleTheme}
      {...stylex.attrs(shared.navLink, styles.iconLink, styles.cursorPointer)}
      aria-label="Toggle theme"
      title={showTitle ? "Toggle theme" : undefined}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  {/snippet}

  <header {...stylex.attrs(styles.header)}>
    <nav {...stylex.attrs(styles.nav)}>
      <a href={resolve("/")} {...stylex.attrs(styles.brand)}>
        <Pokeball sx={styles.pokeball} />
        PokéRemote
      </a>

      <div
        {...stylex.attrs(styles.desktopSearch, onHome && styles.searchClosed)}
        inert={onHome}
      >
        <div {...stylex.attrs(styles.searchWrap)}>
          <PokemonSearch
            navigate
            globalSearch
            placeholder="Search any Pokémon..."
          />
        </div>
      </div>

      <div {...stylex.attrs(styles.navLinks)}>
        {#each primary as link}
          <a
            href={resolve(link.href)}
            {...stylex.attrs(
              shared.navLink,
              isActive(resolve(link.href)) && shared.navLinkActive,
            )}>{link.icon} {link.label}</a
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
          {...stylex.attrs(
            shared.navLink,
            isActive(resolve(quiz.href)) && shared.navLinkActive,
          )}>{quiz.icon} {quiz.label}</a
        >
        <SpriteToggle />
        {@render themeToggle(true)}
        {@render githubLink(true)}
      </div>

      <div {...stylex.attrs(styles.mobileIcons)}>
        {@render themeToggle(false)}
        {@render githubLink(false)}
        <button
          bind:this={menuButton}
          onclick={() => (mobileOpen = !mobileOpen)}
          {...stylex.attrs(
            shared.navLink,
            styles.iconLink,
            styles.cursorPointer,
          )}
          aria-label="Menu"
          aria-expanded={mobileOpen}>☰</button
        >
      </div>
    </nav>

    <div
      {...stylex.attrs(
        styles.mobileSearch,
        !searchOpen && styles.mobileSearchClosed,
        dynamic.searchH(`${searchH}px`),
      )}
      inert={!searchOpen}
      bind:this={searchCollapse}
    >
      <div bind:this={searchRow} {...stylex.attrs(styles.searchRow)}>
        <PokemonSearch
          navigate
          globalSearch
          placeholder="Search any Pokémon..."
        />
      </div>
    </div>

    {#if mobileOpen}
      <div bind:this={mobileMenu} {...stylex.attrs(styles.mobileMenu)}>
        {#each primary as link}
          <a
            href={resolve(link.href)}
            onclick={() => (mobileOpen = false)}
            {...stylex.attrs(
              shared.navLink,
              isActive(resolve(link.href)) && shared.navLinkActive,
              styles.menuLinkBlock,
            )}>{link.icon} {link.label}</a
          >
        {/each}
        {#each groups as group}
          <p {...stylex.attrs(styles.menuLabel)}>
            {group.icon}
            {group.label}
          </p>
          {#each group.items as item}
            <a
              href={resolve(item.href)}
              onclick={() => (mobileOpen = false)}
              {...stylex.attrs(
                shared.navLink,
                isActive(resolve(item.href)) && shared.navLinkActive,
                styles.menuLinkBlock,
                styles.menuLinkIndent,
              )}>{item.icon} {item.label}</a
            >
          {/each}
        {/each}
        <a
          href={resolve(quiz.href)}
          onclick={() => (mobileOpen = false)}
          {...stylex.attrs(
            shared.navLink,
            isActive(resolve(quiz.href)) && shared.navLinkActive,
            styles.menuLinkMt,
            styles.menuLinkBlock,
          )}>{quiz.icon} {quiz.label}</a
        >
        <SpriteToggle mobile onclick={() => (mobileOpen = false)} />
        <p {...stylex.attrs(styles.shortcuts)}>
          Shortcuts: <kbd {...stylex.attrs(shared.kbd)}>/</kbd> search ·
          <kbd {...stylex.attrs(shared.kbd)}>R</kbd> random
        </p>
      </div>
    {/if}
  </header>

  <main {...stylex.attrs(styles.main)}>
    <LoadingBar />
    {@render children()}
  </main>

  {#if showTop}
    <button
      onclick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      {...stylex.attrs(styles.toTop)}
      aria-label="Back to top"
      title="Back to top"
    >
      <svg
        viewBox="0 0 24 24"
        {...stylex.attrs(styles.icon)}
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

  <footer {...stylex.attrs(styles.footer)}>
    <p>
      Credit to PokeAPI · Pokémon and Pokémon character names are trademarks of
      Nintendo · Press <kbd {...stylex.attrs(shared.kbd)}>/</kbd> search ·
      <kbd {...stylex.attrs(shared.kbd)}>R</kbd> random
    </p>
  </footer>
</div>
