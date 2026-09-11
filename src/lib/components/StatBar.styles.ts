import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";

export const styles = stylex.create({
  row: {
    display: "flex",
    alignItems: "center",
  },
  label: {
    textAlign: "right",
    fontWeight: 700,
  },
  value: {
    fontWeight: 900,
  },
  bar: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    overflow: "hidden",
    borderRadius: "9999px",
    backgroundColor: tokens.surf6,
  },
  fill: {
    height: "100%",
    borderRadius: "9999px",
  },
});

export const rows = stylex.create({
  sm: {
    gap: "0.5rem",
  },
  md: {
    gap: "0.75rem",
  },
});

export const labels = stylex.create({
  sm: {
    width: "3rem",
    fontSize: "10px",
    color: tokens.tx45,
  },
  md: {
    width: "3.5rem",
    fontSize: "11px",
    color: tokens.tx50,
  },
});

export const values = stylex.create({
  sm: {
    width: "1.75rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
  },
  md: {
    width: "2rem",
    textAlign: "right",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
});

export const bars = stylex.create({
  sm: {
    height: "0.375rem",
  },
  md: {
    height: "0.5rem",
  },
});

export type StatBarSize = keyof typeof rows;
