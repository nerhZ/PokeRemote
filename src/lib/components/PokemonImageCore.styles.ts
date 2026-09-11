import * as stylex from "@stylexjs/stylex";
import { motion } from "../styles/motion.stylex";
import { tokens } from "../styles/tokens.stylex";

export const styles = stylex.create({
  placeholder: {
    borderRadius: "0.5rem",
    backgroundColor: tokens.surf5,
  },
  img: {
    transitionProperty: "opacity",
    transitionDuration: motion.durBase,
    transitionTimingFunction: motion.easeStandard,
  },
  loaded: {
    opacity: 1,
  },
  loading: {
    opacity: 0,
  },
  pixelated: {
    imageRendering: "pixelated",
  },
});
