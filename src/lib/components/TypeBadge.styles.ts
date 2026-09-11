import * as stylex from "@stylexjs/stylex";
import { motion } from "../styles/motion.stylex";

export const styles = stylex.create({
  tooltip: {
    width: "max-content",
  },
  link: {
    display: "inline-flex",
    borderRadius: "9999px",
    textDecorationLine: "none",
    transitionProperty: "all",
    transitionDuration: motion.durFast,
    transitionTimingFunction: motion.easeStandard,
    ":hover": {
      scale: 1.04,
    },
    ":active": {
      scale: motion.pressScale,
    },
    "@media (prefers-reduced-motion: reduce)": {
      ":hover": {
        scale: 1,
      },
      ":active": {
        scale: 1,
      },
    },
  },
});
