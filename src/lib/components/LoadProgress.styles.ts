import * as stylex from "@stylexjs/stylex";
import { motion } from "../styles/motion.stylex";
import { tokens } from "../styles/tokens.stylex";

export const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingBlock: "5rem",
  },
  pokeball: {
    width: "6rem",
    height: "6rem",
    marginBottom: "2rem",
  },
  label: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: 600,
    color: tokens.text,
  },
  track: {
    marginTop: "1rem",
    height: "0.375rem",
    width: "16rem",
    overflow: "hidden",
    borderRadius: "9999px",
    backgroundColor: tokens.surf6,
  },
  fill: {
    height: "100%",
    borderRadius: "9999px",
    backgroundColor: tokens.accent,
    transitionProperty: "all",
    transitionDuration: motion.durBase,
    transitionTimingFunction: motion.easeStandard,
  },
});
