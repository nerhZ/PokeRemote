# PokeRemote

A modern Pokédex built with SvelteKit and PokeAPI.

**[Open on GitHub Pages](https://nerhz.github.io/PokeRemote/)**

## Features

- **Pokédex** — browse all 1025 species and 1351 forms with infinite scroll, search across the full catalog, and filter by multiple types and generations
- **Pokémon detail** — stats radar, type matchups, evolution chains, learnable moves, and shiny toggle
- **Compare** — side-by-side stat comparison with a shared radar chart and stat difference bar
- **Team Builder** — build a team of 6, see defensive type coverage heatmap, and share via link
- **Damage Calculator** — select attacker, move, and defender for damage ranges with STAB, type effectiveness, and KO estimates
- **Stat Rankings** — top 10 across all forms for each stat, cached for instant revisits
- **Items** — browse all items with effects and costs
- **Dark & light mode** — toggle with persistent preference
- **Favorites & recents** — save favorites and track recently viewed Pokémon
- **Keyboard shortcuts** — press `R` for random Pokémon, `/` to focus search

## Dev

```sh
bun run dev    # start dev server
bun run build  # production build
bun run check  # type check
```

Built with [PokeAPI](https://pokeapi.co/).
