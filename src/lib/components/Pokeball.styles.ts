import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";

const spin = stylex.keyframes({
  to: { transform: "rotate(360deg)" },
});

export const styles = stylex.create({
  root: {
    width: "6rem",
    height: "6rem",
  },
  svg: {
    width: "100%",
    height: "100%",
  },
  spinning: {
    animationName: spin,
    animationDuration: "1s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
    borderColor: `color-mix(in srgb, ${tokens.text} 15%, transparent)`,
    borderTopColor: tokens.text,
  },
});
