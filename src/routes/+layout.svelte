<script lang="ts">
  import { page } from "$app/state";
  import { goto, afterNavigate, beforeNavigate } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { onMount } from "svelte";
  import { applyTheme, getTheme, setTheme, type ThemeMode } from "$lib/storage";
  import { getRandomPokemon } from "$lib/api";
  import { TOTAL_SPECIES } from "$lib/pokemon-types";
  import PokemonSearch from "$lib/components/PokemonSearch.svelte";
  import LoadingBar from "$lib/components/LoadingBar.svelte";
  import "../app.css";

  let { children } = $props();
  let mobileOpen = $state(false);
  let theme = $state<ThemeMode>("dark");

  const links = [
    { href: "/", label: "Pokédex", icon: "◎" },
    { href: "/compare", label: "Compare", icon: "⇄" },
    { href: "/team-builder", label: "Team", icon: "⬡" },
    { href: "/damage-calc", label: "Damage", icon: "⚔" },
    { href: "/rankings", label: "Rankings", icon: "★" },
    { href: "/items", label: "Items", icon: "◆" },
  ] as const;

  function isActive(href: string) {
    if (href === "/") return page.url.pathname === "/";
    return page.url.pathname.startsWith(href);
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    theme = next;
    setTheme(next);
  }

  onMount(() => {
    setTimeout(() => {
      const loader = document.getElementById("app-loader");
      if (loader) {
        loader.style.opacity = "0";
        setTimeout(() => loader.remove(), 350);
      }
    }, 300);

    theme = getTheme();
    applyTheme();

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
        const onHome = page.url.pathname === "/";
        const el = document.querySelector<HTMLInputElement>(
          onHome ? "main [data-global-search]" : "[data-global-search]",
        );
        el?.focus();
      }
      if (e.key === "r" || e.key === "R") {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          getRandomPokemon()
            .then((r) => {
              goto(resolve(`/pokemon/${r.name}`));
            })
            .catch(() => {
              goto(
                resolve(
                  `/pokemon/${Math.floor(Math.random() * TOTAL_SPECIES) + 1}`,
                ),
              );
            });
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  beforeNavigate(({ from, to }) => {
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
    if (to?.url && to.url.search) {
      localStorage.setItem(`pageState:${to.url.pathname}`, to.url.search);
    }

    if (to?.url && !to.url.search) {
      const saved = localStorage.getItem(`pageState:${to.url.pathname}`);
      if (saved) {
        goto(`${to.url.pathname}${saved}`, { replaceState: true });
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
      class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 md:px-6"
    >
      <a
        href={resolve("/")}
        class="flex items-center gap-2.5 text-xl font-extrabold tracking-tighter no-underline md:text-2xl"
        style="color: var(--text)"
      >
        <div
          class="from-pokemon-red relative size-7 rounded-full border-2 border-slate-800 bg-linear-to-b from-50% to-white to-50% after:absolute after:top-1/2 after:left-1/2 after:h-2.5 after:w-2.5 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:border-2 after:border-slate-800 after:bg-white after:content-['']"
        ></div>
        PokéRemote
      </a>

      <div class="hidden min-w-0 flex-1 justify-center px-2 lg:flex">
        <div class="w-full max-w-md">
          <PokemonSearch
            navigate
            globalSearch
            placeholder="Search any Pokémon..."
          />
        </div>
      </div>

      <div class="hidden flex-wrap items-center gap-1 lg:flex">
        {#each links as link}
          <a
            href={resolve(link.href)}
            class="nav-link {isActive(link.href) ? 'nav-link-active' : ''}"
            >{link.icon} {link.label}</a
          >
        {/each}
        <button
          onclick={toggleTheme}
          class="nav-link cursor-pointer border-0 bg-transparent"
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>
        <a
          href="https://github.com/nerhZ/PokeRemote"
          target="_blank"
          rel="noopener noreferrer"
          class="nav-link border-0 bg-transparent focus:outline-none"
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
          class="nav-link cursor-pointer border-0 bg-transparent"
          aria-label="Toggle theme">{theme === "dark" ? "☀" : "☾"}</button
        >
        <a
          href="https://github.com/nerhZ/PokeRemote"
          target="_blank"
          rel="noopener noreferrer"
          class="nav-link border-0 bg-transparent focus:outline-none"
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
          class="nav-link cursor-pointer border-0 bg-transparent"
          aria-label="Menu">☰</button
        >
      </div>
    </nav>

    <div class="px-4 pt-2 md:px-6 lg:hidden">
      <PokemonSearch
        navigate
        globalSearch
        placeholder="Search any Pokémon..."
      />
    </div>

    {#if mobileOpen}
      <div
        class="flex flex-col gap-1 border-t px-4 py-3 lg:hidden"
        style="border-color: var(--border); background: var(--bg)"
      >
        {#each links as link}
          <a
            href={resolve(link.href)}
            onclick={() => (mobileOpen = false)}
            class="nav-link {isActive(link.href)
              ? 'nav-link-active'
              : ''} block">{link.icon} {link.label}</a
          >
        {/each}
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
