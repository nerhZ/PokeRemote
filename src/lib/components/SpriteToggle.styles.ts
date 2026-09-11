import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";

export const styles = stylex.create({
  toggle: {
    cursor: "pointer",
    borderWidth: 0,
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
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
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
