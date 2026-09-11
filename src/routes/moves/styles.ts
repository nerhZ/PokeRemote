import * as stylex from "@stylexjs/stylex";
import { tokens } from "../../lib/styles/tokens.stylex";

export const styles = stylex.create({
  filterSection: {
    marginBottom: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  searchRow: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    "@media (min-width: 48rem)": {
      flexDirection: "row",
      alignItems: "center",
    },
  },
  searchInput: {
    maxWidth: "none",
    "@media (min-width: 48rem)": {
      maxWidth: "20rem",
    },
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.375rem",
  },
  resultNote: {
    marginBottom: "0.75rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: tokens.muted,
  },
  grid: {
    marginBottom: "2rem",
    display: "grid",
    gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
    gap: "0.75rem",
    "@media (min-width: 40rem)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    "@media (min-width: 64rem)": {
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    },
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    padding: "1rem",
    "@media (min-width: 48rem)": {
      padding: "1rem",
    },
  },
  cardHead: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  name: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: 700,
  },
  damageClass: {
    marginInlineStart: "auto",
    flexShrink: 0,
    fontSize: "10px",
    fontWeight: 700,
    color: tokens.tx40,
    textTransform: "capitalize",
  },
  stats: {
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.025em",
    color: tokens.tx50,
  },
  effect: {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2,
    overflow: "hidden",
    fontSize: "0.75rem",
    lineHeight: 1.625,
    color: tokens.tx50,
  },
  skeletonTile: {
    height: "8rem",
  },
  retryWrap: {
    marginBottom: "1rem",
    display: "flex",
    justifyContent: "center",
  },
  retryButton: {
    cursor: "pointer",
    borderRadius: "0.75rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.bd10,
    backgroundColor: tokens.surf5,
    paddingInline: "1rem",
    paddingBlock: "0.5rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    fontWeight: 600,
    color: tokens.tx60,
    ":hover": {
      color: tokens.txStrong,
    },
  },
});
