import * as stylex from "@stylexjs/stylex";
import { motion } from "../styles/motion.stylex";
import { tokens } from "../styles/tokens.stylex";

export const styles = stylex.create({
  toggle: {
    cursor: "pointer",
    borderWidth: 0,
    ":active": {
      scale: motion.pressScale,
    },
    "@media (prefers-reduced-motion: reduce)": {
      ":active": {
        scale: 1,
      },
    },
  },
  toggleMobile: {
    marginTop: "0.5rem",
    display: "block",
    width: "100%",
    textAlign: "left",
  },
  label: {
    backgroundImage: `linear-gradient(to right, ${tokens.pokemonRed}, ${tokens.pokemonYellow}, ${tokens.accent})`,
    backgroundClip: "text",
    color: "transparent",
    fontWeight: 900,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    transitionProperty: "all",
    transitionTimingFunction: motion.easeStandard,
    transitionDuration: motion.durFast,
    opacity: 0.55,
    [stylex.when.ancestor(":hover")]: {
      opacity: 1,
    },
  },
  labelActive: {
    opacity: 1,
    filter: "drop-shadow(0 0 6px rgba(255,203,5,0.55))",
  },
});
