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
| `bun knip`               | Check for unused code       |

### Before committing

Always run `bun run check`, `bun knip`, and `bun run format` (or at minimum `bun run format:check`) to ensure clean type-checking, no unused code, and consistent formatting before finalizing changes.

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

- **Styling is StyleX** (no Tailwind). Styles live in a co-located `<Component>.styles.ts` (`stylex.create`) next to each component/page and are applied with `{...stylex.attrs(...)}`. Never put utility class strings in markup, and never mix a literal `class="..."` with a `stylex.attrs` spread. Cross-cutting styles (panel, tool-shell, nav-link, poke-card, ui-input, ...) live in `src/lib/styles/shared.stylex.ts`. Components that accept external styles take a typed `sx` prop from `src/lib/styles/stylex-types.ts` (`PopupSx`, `HostSx`, `PanelSx`, `BoxSx`, `ShellSx`, `ButtonSx`, `ImageSx`) merged inside via `stylex.attrs(styles.base, sx)`.
- **Tokens are typed constants**: refer to theme values through `tokens` from `src/lib/styles/tokens.stylex.ts` (`import { tokens } from "../styles/tokens.stylex";`), never as bare `"var(--tx-40)"` strings, so token typos fail `bun run check`. The import must be relative - the StyleX compiler cannot resolve the `$lib` alias inside `.stylex.ts` files.
- **Variant unions derive from the styles**: export the variant namespace and a `keyof typeof` type from the `.styles.ts` file (e.g. `export type BadgeSize = keyof typeof sizes`), then use it for the component prop so style and prop can't drift.
- **No static inline styles**: static values (colors, borders, backgrounds) belong in the style object, never in a `style="..."` attribute. Only genuinely runtime values stay inline.
- **Dynamic values go through `dynamic.*`**, not a `style="..."` attribute. Svelte does not track dependencies read in a style attribute when the element also has a `{...stylex.attrs(...)}` spread, so the value goes stale without warning. This caused the Type Chart not to size after a refresh. Pass them into the spread instead, for example `{...stylex.attrs(styles.cell, dynamic.height(`${rowHeight}px`))}` from `src/lib/styles/dynamic.stylex.ts`. Test the hard-refresh path for anything sized by JS.
- **Tokens are StyleX variables**: `src/lib/styles/tokens.stylex.ts` defines the default (dark) values with `defineVars`, and `src/lib/styles/themes.ts` overrides them for light with `createTheme`. `storage.ts` applies the theme class to `<html>` alongside `data-theme` (the attribute is kept for the pre-paint `app.html` shell and `color-scheme`). Import `tokens` with a relative path (the StyleX compiler cannot resolve the `$lib` alias into `.stylex.ts` files). For mixes/gradients use template literals in the style, e.g. `` `color-mix(in srgb, ${tokens.accent} 50%, transparent)` ``. Adding a token means adding it to `tokens.stylex.ts` and, if it changes between themes, to `themes.ts`.
- **Keyframes** are defined with `stylex.keyframes` in the style module that uses them (cross-module keyframes imports do not resolve); reference them via `animationName`.
- **`src/app.html` is the only place with authored CSS**: the global reset (in `@layer base`), `::selection` and scrollbar styling, and the pre-paint theme script/loader. StyleX cannot target global selectors or run before the bundle. `src/styles.css` is an empty anchor imported so the StyleX compiler has a CSS asset to append its output to; never add rules there.
- **Light mode** comes entirely from the StyleX theme class; there is no `!important` remap layer and no semantic `--tx-*` vars in CSS anymore. Use the typed `tokens.*` references, never hardcoded white/black opacities.
- Use `PokemonImage` for Pokémon images (not raw `<img>`) - it honors the global sprite mode, fallback chains, and lazy loading.
- **Popovers** (trigger button + floating panel): use `Popover.svelte` rather than rolling your own positioning/dismissal. Its panels are absolutely positioned and must never affect layout - an in-flow expansion stretches every card in the CSS grid row (this was tried and reverted). The host wraps both trigger and panel, so trigger clicks never count as "outside"; don't add exclusion hacks for toggle buttons. Consumers: `LearnerList`, the home forms picker.
- **Tooltips** are JS-visible (hover / keyboard focus / click-to-pin) and teleported to `<body>` as `position: fixed` at `z-index: 9999`, escaping ancestor stacking contexts and overflow clipping. Two invariants in `Tooltip.svelte` are load-bearing: a module-level registry allows exactly one visible tooltip app-wide (hover/focus/click on another trigger releases the earlier one), and the teleport effect's cleanup removes the popup node - without it, navigating away while pinned leaks a permanently visible orphan. Alignment tracking registers window listeners **only while visible**; dense grids instantiate thousands of tooltips.
- Tooltip triggers intentionally put `tabindex` on non-interactive elements with `svelte-ignore a11y_no_noninteractive_tabindex` comments - keep the ignores when touching them.
- Outside-click/Escape dismissal for any overlay goes through `onDismiss(host, close)` in `src/lib/popup.ts`, returned from an effect guarded on the open state so listeners exist only while visible. Follow that shape for new overlays. If the toggle trigger lives outside the panel (e.g. the mobile menu hamburger), pass the `except` option so its own click still toggles instead of racing the dismissal.
- The mobile search fly-out's open height is kept current by a `ResizeObserver` in `+layout.svelte` (writes the `--search-h` var and patches an open row live). Don't replace it with a one-shot mount measure - webfont timing made that a few pixels short, and the panel below painted over the input's bottom edge.
- Mobile nav icon buttons (theme/GitHub) must not gain `title` attributes - native title tooltips render over the fly-out search box directly below them. `aria-label`s are already present; the snippets in `+layout.svelte` take a `showTitle` param for this reason.
- The home page starts the catalog fetch immediately but defers the grid render until the header collapse animation finishes (`onCollapseFinished` in `src/lib/search-anim.ts`) - keep that fetch/apply split if you touch the flow.
- Shared client state lives in `.svelte.ts` modules (`sprite-mode.svelte.ts`, `loading-state.svelte.ts`) - follow that pattern for new global state.
