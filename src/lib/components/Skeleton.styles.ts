import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";

const pulse = stylex.keyframes({
  "50%": { opacity: 0.5 },
});

export const styles = stylex.create({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
    gap: "0.75rem",
  },
  cols2: {
    "@media (min-width: 40rem)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
  },
  cols3: {
    "@media (min-width: 40rem)": {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    "@media (min-width: 64rem)": {
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    },
  },
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  tile: {
    animationName: pulse,
    animationDuration: "2s",
    animationTimingFunction: "cubic-bezier(0.4, 0, 0.6, 1)",
    animationIterationCount: "infinite",
    borderRadius: "1rem",
    backgroundColor: tokens.surf3,
    height: "6rem",
  },
});
