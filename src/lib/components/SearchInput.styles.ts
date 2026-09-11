import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";
import { motion } from "../styles/motion.stylex";

export const styles = stylex.create({
  input: {
    width: "100%",
    borderRadius: motion.radiusControl,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens.bd10,
    backgroundColor: tokens.surf5,
    paddingInline: "1rem",
    paddingBlock: "0.625rem",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    outlineStyle: "none",
    "::placeholder": {
      color: tokens.ph30,
    },
    ":focus": {
      borderColor: `color-mix(in srgb, ${tokens.accent} 50%, transparent)`,
    },
  },
});
