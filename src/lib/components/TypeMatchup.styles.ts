import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";

export const styles = stylex.create({
  empty: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: tokens.tx40,
  },
  rows: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  rowHead: {
    marginBottom: "0.5rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  mult: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: 600,
  },
  rowLabel: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: tokens.tx40,
  },
  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.375rem",
  },
});
