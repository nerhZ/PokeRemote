# AGENTS.md

## Package manager

This project uses **Bun** as its package manager and runtime. The lockfile is `bun.lock`.

- Use `bun run <script>` — never `npm`, `yarn`, or `pnpm`.
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

### Before committing

Always run `bun run check` and `bun run format` (or at minimum `bun run format:check`) to ensure clean type-checking and consistent formatting before finalizing changes.

The `npm` and `node` aliases may exist but are **not** the canonical toolchain for this repo.
