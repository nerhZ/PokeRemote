import * as stylex from "@stylexjs/stylex";
import { motion } from "../styles/motion.stylex";
import { tokens } from "../styles/tokens.stylex";

export const chipStyles = stylex.create({
  chip: {
    cursor: "pointer",
    borderRadius: "9999px",
    borderWidth: 1,
    borderStyle: "solid",
    paddingInline: "0.625rem",
    paddingBlock: "0.25rem",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.025em",
    textTransform: "uppercase",
    ":active": {
      scale: motion.pressScale,
    },
    "@media (prefers-reduced-motion: reduce)": {
      ":active": {
        scale: 1,
      },
    },
  },
  disabled: {
    borderColor: tokens.bd5,
    backgroundColor: tokens.surf2,
    color: tokens.tx25,
    cursor: "not-allowed",
  },
  idle: {
    borderColor: tokens.bd10,
    backgroundColor: tokens.surf5,
    color: tokens.tx55,
  },
  inverted: {
    borderColor: tokens.btnBg,
    backgroundColor: tokens.btnBg,
    color: tokens.btnFg,
  },
  colorVariant: {
    borderColor: "transparent",
  },
  accent: {
    backgroundColor: tokens.accent,
    borderColor: tokens.accent,
    color: tokens.onAccent,
  },
  countBadge: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    marginLeft: "0.25rem",
    borderRadius: "9999px",
    paddingInline: "0.375rem",
    paddingBlock: "0.125rem",
    fontSize: "8px",
  },
  countBadgeActive: {
    backgroundColor: "#000",
    color: "#fff",
  },
});
