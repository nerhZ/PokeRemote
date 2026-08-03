# PokeRemote

A modern Pokédex built with SvelteKit and PokeAPI.

**[Open on GitHub Pages](https://nerhz.github.io/PokeRemote/)**

## Features

- **Pokédex** — browse all 1025 species and 1351 forms with infinite scroll, search across the full catalog, and filter by multiple types and generations (shareable via URL)
- **Pokémon detail** — stats radar, type matchups, evolution chains, learnable moves, shiny toggle, and one-click Compare/Team/Share actions
- **Compare** — side-by-side stat comparison with a shared radar chart and stat difference bar
- **Team Builder** — build a team of 6, see defensive type coverage heatmap, offensive move coverage & blind spots, and share via link
- **Damage Calculator** — attacker, move, and defender with natures, EVs, IVs, items, STAB, type effectiveness, and KO estimates
- **Stat Rankings** — top 10 across all forms for each stat (incl. exp, height, weight, move count), cached for instant revisits
- **Items, Abilities & Moves** — browse full dexes with effects and costs, with instant cached revisits
- **Type Chart** — interactive 18×18 matchup chart
- **Quiz** — "Who's That Pokémon?" silhouette guessing game with streaks
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
