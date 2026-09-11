import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";

export const styles = stylex.create({
  root: {
    borderRadius: "0.75rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.bd6,
    backgroundColor: tokens.surf2,
    padding: "0.625rem",
  },
  header: {
    marginBottom: "0.375rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
  },
  label: {
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    color: tokens.tx40,
    textTransform: "uppercase",
  },
  ivRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "10px",
    color: tokens.tx40,
  },
  ivInput: {
    width: "3rem",
    borderRadius: "0.375rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.bd10,
    backgroundColor: tokens.surf5,
    paddingInline: "0.375rem",
    paddingBlock: "0.125rem",
    textAlign: "right",
    fontSize: "10px",
    outlineStyle: "none",
    ":focus": {
      borderColor: `color-mix(in srgb, ${tokens.accent} 50%, transparent)`,
    },
  },
  warning: {
    fontSize: "10px",
    color: tokens.pokemonRed,
  },
  grid: {
    display: "grid",
    gap: "0.375rem",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.125rem",
  },
  statLabel: {
    fontSize: "9px",
    fontWeight: 700,
    color: tokens.tx40,
  },
  statInput: {
    width: "100%",
    borderRadius: "0.375rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.bd10,
    backgroundColor: tokens.surf5,
    paddingInline: "0.25rem",
    paddingBlock: "0.25rem",
    textAlign: "center",
    fontSize: "10px",
    outlineStyle: "none",
    ":focus": {
      borderColor: `color-mix(in srgb, ${tokens.accent} 50%, transparent)`,
    },
  },
});
