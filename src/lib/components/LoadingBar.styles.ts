import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";

const navLoadingBar = stylex.keyframes({
  "0%": { transform: "translateX(-100%)" },
  "60%": { transform: "translateX(200%)" },
  "100%": { transform: "translateX(200%)" },
});

export const styles = stylex.create({
  track: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    zIndex: 10,
    height: "0.125rem",
    overflow: "hidden",
    backgroundColor: tokens.surf5,
  },
  fill: {
    height: "100%",
    width: "33%",
    backgroundColor: `color-mix(in srgb, ${tokens.accent} 70%, transparent)`,
    animationName: navLoadingBar,
    animationDuration: "1.2s",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
  },
});
