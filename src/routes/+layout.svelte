<script lang="ts">
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { base } from "$app/paths";
	import { onMount } from "svelte";
	import { applyTheme, getTheme, setTheme, type ThemeMode } from "$lib/storage";
	import { getRandomPokemon } from "$lib/api";
	import { TOTAL_SPECIES } from "$lib/pokemon-types";
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
	];

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
		theme = getTheme();
		applyTheme();

		function onKey(e: KeyboardEvent) {
			const tag = (e.target as HTMLElement)?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) return;
			if (e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) {
				e.preventDefault();
				const el = document.querySelector<HTMLInputElement>("[data-global-search], input[type='search'], input[placeholder*='Search']");
				el?.focus();
			}
			if (e.key === "r" || e.key === "R") {
				if (!e.metaKey && !e.ctrlKey && !e.altKey) {
					getRandomPokemon({})
						.then((r) => { goto(`${base}/pokemon/${r.name}`); })
						.catch(() => { goto(`${base}/pokemon/${Math.floor(Math.random() * TOTAL_SPECIES) + 1}`); });
				}
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});
</script>

<svelte:head>
	<title>PokéRemote - Modern Pokedex</title>
</svelte:head>

<div class="flex flex-col min-h-screen">
	<header class="py-3 border-b sticky top-0 z-50 backdrop-blur-md" style="background: color-mix(in srgb, var(--bg) 85%, transparent); border-color: var(--border)">
		<nav class="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between gap-3">
			<a href="{base}/" class="flex items-center gap-2.5 text-xl md:text-2xl font-extrabold tracking-tighter no-underline" style="color: var(--text)">
				<div class="size-7 rounded-full border-2 border-slate-800 relative bg-linear-to-b from-pokemon-red from-50% to-white to-50% after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-2.5 after:h-2.5 after:bg-white after:border-2 after:border-slate-800 after:rounded-full"></div>
				PokéRemote
			</a>

			<div class="hidden md:flex items-center gap-1 flex-wrap">
				{#each links as link}
					<a href="{base}{link.href}" class="nav-link {isActive(link.href) ? 'nav-link-active' : ''}">{link.icon} {link.label}</a>
				{/each}
				<button onclick={toggleTheme} class="nav-link cursor-pointer border-0 bg-transparent" aria-label="Toggle theme" title="Toggle theme">
					{theme === "dark" ? "☀" : "☾"}
				</button>
			</div>

			<div class="flex md:hidden items-center gap-2">
				<button onclick={toggleTheme} class="nav-link cursor-pointer border-0 bg-transparent" aria-label="Toggle theme">{theme === "dark" ? "☀" : "☾"}</button>
				<button onclick={() => (mobileOpen = !mobileOpen)} class="nav-link cursor-pointer border-0 bg-transparent" aria-label="Menu">☰</button>
			</div>
		</nav>

		{#if mobileOpen}
			<div class="md:hidden border-t px-4 py-3 flex flex-col gap-1" style="border-color: var(--border); background: var(--bg)">
				{#each links as link}
					<a href={link.href} onclick={() => (mobileOpen = false)} class="nav-link {isActive(link.href) ? 'nav-link-active' : ''} block">{link.icon} {link.label}</a>
				{/each}
				<p class="text-[10px] px-3 pt-2" style="color: var(--muted)">Shortcuts: <kbd>/</kbd> search · <kbd>R</kbd> random</p>
			</div>
		{/if}
	</header>

	<main class="flex-1">
		{@render children()}
	</main>

	<footer class="max-w-7xl mx-auto px-6 py-8 text-center text-xs" style="color: var(--muted)">
		<p>Credit to PokeAPI · Press <kbd>/</kbd> search · <kbd>R</kbd> random</p>
	</footer>
</div>
