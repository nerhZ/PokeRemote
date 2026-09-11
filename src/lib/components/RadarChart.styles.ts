import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";

export const styles = stylex.create({
  chart: {
    marginInline: "auto",
    width: "100%",
  },
  legend: {
    marginTop: "0.5rem",
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
  },
  grid: {
    stroke: tokens.chartGrid,
  },
  label: {
    fill: tokens.chartLabel,
  },
});
