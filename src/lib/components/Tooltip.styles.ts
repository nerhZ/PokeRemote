import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";
import { motion } from "../styles/motion.stylex";

export const styles = stylex.create({
  host: {
    position: "relative",
    display: "inline-block",
    cursor: "default",
  },
  popup: {
    pointerEvents: "none",
    position: "fixed",
    zIndex: 9999,
    width: "16rem",
    borderRadius: motion.radiusControl,
    borderWidth: 1,
    borderStyle: "solid",
    padding: "0.75rem",
    textAlign: "left",
    fontSize: "11px",
    lineHeight: "1.625",
    boxShadow: tokens.shadow3,
    backgroundColor: tokens.card,
    borderColor: tokens.border,
    color: tokens.mutedStrong,
  },
  nowrap: {
    whiteSpace: "nowrap",
  },
  normal: {
    whiteSpace: "normal",
  },
});
