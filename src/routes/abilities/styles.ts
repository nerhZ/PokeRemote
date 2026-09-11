import * as stylex from "@stylexjs/stylex";
import { tokens } from "../../lib/styles/tokens.stylex";

export const styles = stylex.create({
  filters: {
    marginBottom: "1rem",
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
    justifyContent: "space-between",
    gap: "0.5rem",
  },
  cardName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: 700,
  },
  genBadge: {
    borderRadius: "9999px",
    borderWidth: 1,
    borderStyle: "solid",
    paddingInline: "0.5rem",
    paddingBlock: "0.125rem",
    fontSize: "10px",
    fontWeight: 700,
  },
  effect: {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 3,
    overflow: "hidden",
    fontSize: "0.75rem",
    lineHeight: 1.625,
    color: tokens.tx50,
  },
  effectMissing: {
    fontSize: "0.75rem",
    lineHeight: 1.625,
    color: tokens.tx40,
    fontStyle: "italic",
  },
});
