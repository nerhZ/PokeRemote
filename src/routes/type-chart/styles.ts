import * as stylex from "@stylexjs/stylex";
import { tokens } from "../../lib/styles/tokens.stylex";

export const styles = stylex.create({
  shell: {
    paddingInline: "1rem",
    paddingBlock: "0.5rem",
    "@media (min-width: 48rem)": {
      paddingInline: "1.5rem",
    },
  },
  hero: {
    marginInline: "auto",
    marginBottom: "0.75rem",
    maxWidth: "80rem",
  },
  title: {
    fontSize: "1.5rem",
    lineHeight: "calc(2 / 1.5)",
    "@media (min-width: 48rem)": {
      fontSize: "1.875rem",
      lineHeight: "calc(2.25 / 1.875)",
    },
  },
  subtitle: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    "@media (min-width: 48rem)": {
      fontSize: "0.875rem",
      lineHeight: "calc(1.25 / 0.875)",
    },
  },
  scroll: {
    marginInline: "auto",
    width: "100%",
    overflowX: "auto",
    borderRadius: "1rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.border,
  },
  grid: {
    display: "grid",
    minWidth: "65rem",
    gridTemplateColumns: "8.5rem repeat(18, minmax(3.25rem, 1fr))",
  },
  corner: {
    position: "sticky",
    left: 0,
    zIndex: 10,
    padding: "0.5rem",
    backgroundColor: tokens.card,
  },
  chartTooltip: {
    width: "max-content",
    maxWidth: "min(24rem, calc(100vw - 2rem))",
  },
  chartHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingBottom: "0.375rem",
  },
  headerButton: {
    cursor: "default",
  },
  headerLabel: {
    fontWeight: 700,
    letterSpacing: "0.025em",
    textTransform: "uppercase",
  },
  chartRow: {
    position: "sticky",
    left: 0,
    zIndex: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.bd4,
    backgroundColor: tokens.card,
  },
  rowButton: {
    display: "flex",
    height: "100%",
    width: "100%",
    cursor: "default",
    alignItems: "center",
    paddingInline: "0.5rem",
  },
  rowLabel: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  cell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },
  cellZero: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    color: tokens.tx40,
  },
  cellSuper: {
    backgroundColor: `color-mix(in srgb, ${tokens.pokemonRed} 25%, transparent)`,
    color: tokens.pokemonRed,
  },
  cellResist: {
    backgroundColor: `color-mix(in srgb, ${tokens.pokemonGreen} 25%, transparent)`,
    color: tokens.pokemonGreen,
  },
  cellNeutral: {
    color: tokens.tx30,
  },
  legend: {
    marginInline: "auto",
    marginTop: "0.75rem",
    display: "flex",
    width: "100%",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: "1.25rem",
    rowGap: "0.5rem",
    fontSize: "11px",
    color: tokens.muted,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
  },
  legendSwatchRed: {
    height: "0.625rem",
    width: "0.625rem",
    borderRadius: "0.25rem",
    backgroundColor: `color-mix(in srgb, ${tokens.pokemonRed} 40%, transparent)`,
  },
  legendSwatchGreen: {
    height: "0.625rem",
    width: "0.625rem",
    borderRadius: "0.25rem",
    backgroundColor: `color-mix(in srgb, ${tokens.pokemonGreen} 40%, transparent)`,
  },
  legendSwatchNone: {
    height: "0.625rem",
    width: "0.625rem",
    borderRadius: "0.25rem",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  legendSwatchNeutral: {
    height: "0.625rem",
    width: "0.625rem",
    borderRadius: "0.25rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.bd25,
  },
  legendNote: {
    flexBasis: "100%",
  },
});
