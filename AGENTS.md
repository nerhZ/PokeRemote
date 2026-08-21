# AGENTS.md

## Package manager

This project uses **Bun** as its package manager and runtime. The lockfile is `bun.lock`.

- Use `bun run <script>` - never `npm`, `yarn`, or `pnpm`.
- Use `bun add <pkg>` / `bun add -d <pkg>` to install dependencies.
- Use `bun x <tool>` to run one-off CLIs (e.g. `bun x sv`).

### Available scripts

| Command                  | Purpose                     |
|--------------------------|-----------------------------|
| `bun run dev`            | Start dev server            |
| `bun run build`          | Production build            |
| `bun run check`          | Type-check (svelte-check)   |
| `bun run preview`        | Preview production build    |
| `bun run format:check`   | Check formatting (prettier) |
| `bun run format`         | Fix formatting (prettier)   |
| `bun run lint:tailwind`  | Check Tailwind class order  |
| `bun run fix:tailwind`   | Fix Tailwind class order    |
| `bun knip`               | Check for unused code       |

### Before committing

Always run `bun run check`, `bun knip`, and `bun run format` (or at minimum `bun run format:check`) to ensure clean type-checking, no unused code, and consistent formatting before finalizing changes.

`bun run lint:tailwind` reports one pre-existing class-order flag in `Tooltip.svelte` even on a clean checkout. Don't chase it, but don't add new flags either.

The `npm` and `node` aliases may exist but are **not** the canonical toolchain for this repo.

## Debugging UI bugs

Don't start Playwright (or write servers/scripts to try to interact with the app) to investigate UI issues - it's slow and inefficient. Just make a change, let the user verify it in the browser, and iterate from there; that's much simpler.

There is no test suite - verification is `bun run check` plus manual browser testing by the user.

Vite's dev overlay can show stale errors from mid-edit HMR states, and HMR handles `<script module>` blocks badly (old module keeps running until a full reload). Before trusting a compile error or a "still broken" report, run `bun run build` against the saved files and hard-reload the browser.

## Architecture (read before touching pages)

- **SPA only**: `src/routes/+layout.ts` sets `ssr = false; prerender = false`. There are no load functions - all data is fetched client-side from PokeAPI at runtime.
- **Base path**: deployed to GitHub Pages under a base (`BASE_PATH`, see `svelte.config.js` and `.github/workflows/deploy.yml`). On production `page.url.pathname` includes the base, so always compare paths with `resolve("/")` from `$app/paths` - a hardcoded `"/"` silently breaks deployed behavior.
- **Deploy build**: `bun run build` runs `scripts/postbuild.mjs`, which copies `404.html` to `index.html` for GitHub Pages' SPA fallback. Don't remove that step.
- **`page.url` reactivity**: `page.url` is replaced on every navigation, including query-param-only changes, so an `$effect` that reads `page.url.pathname` also re-runs on query changes. To key an effect on the pathname only, read it through a `$derived` boolean (see the `isHome` effect in `src/routes/+page.svelte`). Use `untrack` for params you don't want the effect to react to.
- **Tool pages** (compare, team-builder, damage-calc) treat URL query params as source of truth via `pageUrlSync` (`src/lib/url-state.ts`), pushed with `replaceState: true` - browser back does not undo selections (by design). Async slot loads use `selectPokemonSlot`'s effect-generation guard (`gen`/`effectGen`) to drop stale responses.
- **Pokémon detail**: the URL param may be an id or a name (PokeAPI normalizes `/pokemon/26` → `raticate`). Never detect navigation by comparing `page.params.name` to `pokemon.name` - track the requested key instead (`loadedName` in `src/routes/pokemon/[name]/+page.svelte`).
- **Damage calc**: all extra multipliers (items, weather, terrain) go through `calculateDamage`'s `modifiers` param (`src/lib/pokemon-types.ts`) so rounding stays a single final floor - never post-multiply floored results. Eviolite applies only to not-fully-evolved defenders (`isNfe` in `src/routes/damage-calc/+page.svelte`).
- **State persistence**: the layout saves each route's last query string to `pageState:${pathname}` (capped at 12 keys) and restores it on revisit; `previousUrl` powers the Pokémon page's back button. Keep these keys intact.

## PokeAPI & caches

- No bulk endpoint exists: the home grid fetches all 1025 species in one parallel burst (species + pokemon per entry, ~2050 requests) with a batched retry pass for stragglers. Wave-batching was deliberately removed for speed - don't reintroduce it without checking with the user.
- Some species have no `/pokemon/{speciesName}` resource (default variety name differs: `basculin` → `basculin-red-striped`; also pumpkaboo, gourgeist, minior). `fetchEntry` in `src/lib/api.ts` falls back to the default form's name - keep that.
- Evolution chains are mirrored to the viewed form's region (`applyRegionalForms` in `src/lib/api.ts` renames chain nodes to variants like `rattata-alola`). Match chain nodes to species identity via `baseSpeciesName()` (same file) - exact comparison against `species_name` silently misses regional forms.
- Data caches are localStorage keys `pokeremote:*`, versioned by constants (`GRID_CACHE_VERSION`, `MOVE_CACHE_VERSION`, ...) in `src/lib/api.ts`. Bump the version when the cached payload shape changes. Cache hits are served immediately with background count validation - that pattern is centralized in `validateInBackground` (`src/lib/api.ts`), so reuse it for new caches instead of hand-rolling the IIFE again.
- README's feature list is aspirational in places (e.g. "infinite scroll" on the Pokédex; the grid actually renders everything at once).

## UI conventions

- **Light mode** is a hand-maintained `!important` override layer in `src/app.css` remapping `white/N` opacity utilities to CSS vars. Any new `bg-white/N`, `text-white/N`, or `border-white/N` value must be added to those lists or it is invisible in light mode.
- Use `PokemonImage` for Pokémon images (not raw `<img>`) - it honors the global sprite mode, fallback chains, and lazy loading.
- **Popovers** (trigger button + floating panel): use `Popover.svelte` rather than rolling your own positioning/dismissal. Its panels are absolutely positioned and must never affect layout - an in-flow expansion stretches every card in the CSS grid row (this was tried and reverted). The host wraps both trigger and panel, so trigger clicks never count as "outside"; don't add exclusion hacks for toggle buttons. Consumers: `LearnerList`, the home forms picker.
- **Tooltips** are JS-visible (hover / keyboard focus / click-to-pin) and teleported to `<body>` as `position: fixed` at `z-[9999]`, escaping ancestor stacking contexts and overflow clipping. Two invariants in `Tooltip.svelte` are load-bearing: a module-level registry allows exactly one visible tooltip app-wide (hover/focus/click on another trigger releases the earlier one), and the teleport effect's cleanup removes the popup node - without it, navigating away while pinned leaks a permanently visible orphan. Alignment tracking registers window listeners **only while visible**; dense grids instantiate thousands of tooltips.
- Tooltip triggers intentionally put `tabindex` on non-interactive elements with `svelte-ignore a11y_no_noninteractive_tabindex` comments - keep the ignores when touching them.
- Outside-click/Escape dismissal for any overlay goes through `onDismiss(host, close)` in `src/lib/popup.ts`, returned from an effect guarded on the open state so listeners exist only while visible. Follow that shape for new overlays. If the toggle trigger lives outside the panel (e.g. the mobile menu hamburger), pass the `except` option so its own click still toggles instead of racing the dismissal.
- The mobile search fly-out's open height is kept current by a `ResizeObserver` in `+layout.svelte` (writes the `--search-h` var and patches an open row live). Don't replace it with a one-shot mount measure - webfont timing made that a few pixels short, and the panel below painted over the input's bottom edge.
- Mobile nav icon buttons (theme/GitHub) must not gain `title` attributes - native title tooltips render over the fly-out search box directly below them. `aria-label`s are already present; the snippets in `+layout.svelte` take a `showTitle` param for this reason.
- The home page starts the catalog fetch immediately but defers the grid render until the header collapse animation finishes (`onCollapseFinished` in `src/lib/search-anim.ts`) - keep that fetch/apply split if you touch the flow.
- Shared client state lives in `.svelte.ts` modules (`sprite-mode.svelte.ts`, `loading-state.svelte.ts`) - follow that pattern for new global state.
